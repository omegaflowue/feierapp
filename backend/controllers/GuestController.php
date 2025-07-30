<?php

namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\filters\ContentNegotiator;
use yii\web\Response;
use yii\filters\Cors;
use app\models\Guest;
use app\models\Event;
use app\models\Invitation;

class GuestController extends ActiveController
{
    public $modelClass = 'app\models\Guest';

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['*'],
                'Access-Control-Allow-Credentials' => false,
                'Access-Control-Max-Age' => 86400,
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

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['index'], $actions['view'], $actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Event not found'];
        }

        $guests = Guest::find()
            ->where(['event_id' => $event->id])
            ->with('contributions')
            ->all();

        return $guests;
    }

    public function actionView($token)
    {
        $guest = Guest::find()
            ->where(['unique_token' => $token])
            ->with(['event', 'contributions'])
            ->one();
        
        if (!$guest) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Guest not found'];
        }

        $invitation = Invitation::find()
            ->where(['guest_id' => $guest->id])
            ->one();
        
        if ($invitation && !$invitation->opened_at) {
            $invitation->opened_at = date('Y-m-d H:i:s');
            $invitation->save();
        }

        return [
            'guest' => $guest,
            'event' => $guest->event,
            'contributions' => $guest->contributions,
        ];
    }

    public function actionCreate($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Event not found'];
        }

        $guest = new Guest();
        $guest->event_id = $event->id;
        $guest->load(Yii::$app->request->post(), '');
        
        if ($guest->save()) {
            $invitation = new Invitation();
            $invitation->event_id = $event->id;
            $invitation->guest_id = $guest->id;
            $invitation->save();
            
            Yii::$app->response->statusCode = 201;
            return $guest;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $guest->errors];
        }
    }

    public function actionUpdate($token)
    {
        $guest = Guest::find()->where(['unique_token' => $token])->one();
        
        if (!$guest) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Guest not found'];
        }

        $guest->load(Yii::$app->request->bodyParams, '');
        
        if ($guest->save()) {
            $invitation = Invitation::find()
                ->where(['guest_id' => $guest->id])
                ->one();
            
            if ($invitation && !$invitation->responded_at) {
                $invitation->responded_at = date('Y-m-d H:i:s');
                $invitation->save();
            }
            
            return $guest;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $guest->errors];
        }
    }
}