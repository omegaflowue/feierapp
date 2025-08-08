<?php

namespace app\controllers;

use Yii;
use yii\rest\Controller;
use yii\filters\auth\HttpBearerAuth;
use yii\filters\ContentNegotiator;
use yii\web\Response;
use yii\filters\Cors;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use app\models\Event;
use app\models\Guest;
use app\models\RideOffer;
use app\models\RideRequest;
use app\models\RideMatch;

class RideController extends Controller
{
    public function behaviors()
    {
        $behaviors = parent::behaviors();
        
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['http://localhost:8080', 'http://localhost:8081', '*'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['*'],
                'Access-Control-Allow-Credentials' => false,
                'Access-Control-Max-Age' => 86400,
                'Access-Control-Allow-Origin' => ['http://localhost:8080'],
            ],
        ];

        $behaviors['contentNegotiator'] = [
            'class' => ContentNegotiator::class,
            'formats' => [
                'application/json' => Response::FORMAT_JSON,
            ],
        ];

        return $behaviors;
    }

    /**
     * Get all ride offers and requests for an event
     * GET /events/{code}/rides
     */
    public function actionIndex($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            throw new NotFoundHttpException('Event not found');
        }

        $offers = RideOffer::find()
            ->where(['event_id' => $event->id])
            ->with(['driverGuest', 'confirmedMatches'])
            ->orderBy(['departure_time' => SORT_ASC])
            ->all();

        $requests = RideRequest::find()
            ->where(['event_id' => $event->id])
            ->with(['passengerGuest', 'confirmedMatch'])
            ->orderBy(['created_at' => SORT_DESC])
            ->all();

        return [
            'offers' => $offers,
            'requests' => $requests,
            'statistics' => [
                'total_offers' => count($offers),
                'active_offers' => count(array_filter($offers, fn($o) => $o->status === RideOffer::STATUS_ACTIVE)),
                'total_requests' => count($requests),
                'open_requests' => count(array_filter($requests, fn($r) => $r->status === RideRequest::STATUS_OPEN)),
                'total_available_seats' => array_sum(array_map(fn($o) => $o->getRemainingSeats(), $offers)),
            ]
        ];
    }

    /**
     * Create a new ride offer
     * POST /events/{code}/ride-offers
     */
    public function actionCreateOffer($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            throw new NotFoundHttpException('Event not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        // Find guest by token
        if (!isset($data['guest_token'])) {
            throw new BadRequestHttpException('Guest token is required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token'], 'event_id' => $event->id])->one();
        
        if (!$guest) {
            throw new NotFoundHttpException('Guest not found');
        }

        $offer = new RideOffer();
        $offer->event_id = $event->id;
        $offer->driver_guest_id = $guest->id;
        $offer->departure_location = $data['departure_location'] ?? '';
        $offer->departure_time = $data['departure_time'] ?? '';
        $offer->available_seats = $data['available_seats'] ?? 1;
        $offer->car_description = $data['car_description'] ?? null;
        $offer->notes = $data['notes'] ?? null;
        $offer->contact_info = $data['contact_info'] ?? $guest->phone ?: $guest->email;

        if ($offer->save()) {
            Yii::$app->response->statusCode = 201;
            return $offer;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $offer->errors];
        }
    }

    /**
     * Create a new ride request
     * POST /events/{code}/ride-requests
     */
    public function actionCreateRequest($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            throw new NotFoundHttpException('Event not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        // Find guest by token
        if (!isset($data['guest_token'])) {
            throw new BadRequestHttpException('Guest token is required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token'], 'event_id' => $event->id])->one();
        
        if (!$guest) {
            throw new NotFoundHttpException('Guest not found');
        }

        $request = new RideRequest();
        $request->event_id = $event->id;
        $request->passenger_guest_id = $guest->id;
        $request->pickup_location = $data['pickup_location'] ?? '';
        $request->flexible_pickup = $data['flexible_pickup'] ?? false;
        $request->passenger_count = $data['passenger_count'] ?? 1;
        $request->notes = $data['notes'] ?? null;

        if ($request->save()) {
            Yii::$app->response->statusCode = 201;
            return $request;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $request->errors];
        }
    }

    /**
     * Get rides for a specific guest
     * GET /guests/{token}/rides
     */
    public function actionGuestRides($token)
    {
        $guest = Guest::find()->where(['unique_token' => $token])->one();
        
        if (!$guest) {
            throw new NotFoundHttpException('Guest not found');
        }

        $offers = RideOffer::find()
            ->where(['driver_guest_id' => $guest->id])
            ->with(['confirmedMatches', 'rideMatches'])
            ->all();

        $requests = RideRequest::find()
            ->where(['passenger_guest_id' => $guest->id])
            ->with(['confirmedMatch', 'rideMatches'])
            ->all();

        return [
            'offers' => $offers,
            'requests' => $requests,
        ];
    }

    /**
     * Update ride offer
     * PUT /ride-offers/{id}
     */
    public function actionUpdateOffer($id)
    {
        $offer = RideOffer::findOne($id);
        
        if (!$offer) {
            throw new NotFoundHttpException('Ride offer not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        // Verify guest token
        if (!isset($data['guest_token'])) {
            throw new BadRequestHttpException('Guest token is required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token']])->one();
        
        if (!$guest || $guest->id !== $offer->driver_guest_id) {
            throw new BadRequestHttpException('Unauthorized');
        }

        $offer->load($data, '');
        
        if ($offer->save()) {
            return $offer;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $offer->errors];
        }
    }

    /**
     * Update ride request
     * PUT /ride-requests/{id}
     */
    public function actionUpdateRequest($id)
    {
        $request = RideRequest::findOne($id);
        
        if (!$request) {
            throw new NotFoundHttpException('Ride request not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        // Verify guest token
        if (!isset($data['guest_token'])) {
            throw new BadRequestHttpException('Guest token is required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token']])->one();
        
        if (!$guest || $guest->id !== $request->passenger_guest_id) {
            throw new BadRequestHttpException('Unauthorized');
        }

        $request->load($data, '');
        
        if ($request->save()) {
            return $request;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $request->errors];
        }
    }

    /**
     * Create a ride match
     * POST /ride-matches
     */
    public function actionCreateMatch()
    {
        $data = Yii::$app->request->bodyParams;
        
        if (!isset($data['ride_offer_id']) || !isset($data['ride_request_id'])) {
            throw new BadRequestHttpException('Both ride_offer_id and ride_request_id are required');
        }

        // Check if match already exists
        $existingMatch = RideMatch::find()
            ->where(['ride_offer_id' => $data['ride_offer_id'], 'ride_request_id' => $data['ride_request_id']])
            ->one();

        if ($existingMatch) {
            throw new BadRequestHttpException('Match already exists');
        }

        $offer = RideOffer::findOne($data['ride_offer_id']);
        $request = RideRequest::findOne($data['ride_request_id']);

        if (!$offer || !$request) {
            throw new NotFoundHttpException('Ride offer or request not found');
        }

        // Check if offer has available seats
        if ($offer->getRemainingSeats() < $request->passenger_count) {
            throw new BadRequestHttpException('Not enough seats available');
        }

        $match = new RideMatch();
        $match->ride_offer_id = $data['ride_offer_id'];
        $match->ride_request_id = $data['ride_request_id'];
        $match->pickup_location = $data['pickup_location'] ?? $request->pickup_location;
        $match->pickup_time = $data['pickup_time'] ?? null;
        $match->notes = $data['notes'] ?? null;

        if ($match->save()) {
            Yii::$app->response->statusCode = 201;
            return $match;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $match->errors];
        }
    }

    /**
     * Confirm a ride match
     * PUT /ride-matches/{id}/confirm
     */
    public function actionConfirmMatch($id)
    {
        $match = RideMatch::findOne($id);
        
        if (!$match) {
            throw new NotFoundHttpException('Ride match not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        if (!isset($data['guest_token']) || !isset($data['confirm_type'])) {
            throw new BadRequestHttpException('Guest token and confirm_type are required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token']])->one();
        
        if (!$guest) {
            throw new BadRequestHttpException('Guest not found');
        }

        $confirmType = $data['confirm_type']; // 'driver' or 'passenger'

        if ($confirmType === 'driver' && $guest->id === $match->rideOffer->driver_guest_id) {
            $match->confirmByDriver();
        } elseif ($confirmType === 'passenger' && $guest->id === $match->rideRequest->passenger_guest_id) {
            $match->confirmByPassenger();
        } else {
            throw new BadRequestHttpException('Unauthorized to confirm this match');
        }

        return $match;
    }

    /**
     * Decline a ride match
     * PUT /ride-matches/{id}/decline
     */
    public function actionDeclineMatch($id)
    {
        $match = RideMatch::findOne($id);
        
        if (!$match) {
            throw new NotFoundHttpException('Ride match not found');
        }

        $data = Yii::$app->request->bodyParams;
        
        if (!isset($data['guest_token'])) {
            throw new BadRequestHttpException('Guest token is required');
        }

        $guest = Guest::find()->where(['unique_token' => $data['guest_token']])->one();
        
        if (!$guest) {
            throw new BadRequestHttpException('Guest not found');
        }

        // Check if guest is involved in this match
        if ($guest->id !== $match->rideOffer->driver_guest_id && $guest->id !== $match->rideRequest->passenger_guest_id) {
            throw new BadRequestHttpException('Unauthorized to decline this match');
        }

        $match->decline();

        return $match;
    }
}