<?php

namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\filters\auth\HttpBearerAuth;
use yii\filters\ContentNegotiator;
use yii\web\Response;
use yii\filters\Cors;
use app\models\Event;
use app\models\Guest;

class EventController extends ActiveController
{
    public $modelClass = 'app\models\Event';

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

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['index'], $actions['view'], $actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex()
    {
        $events = Event::find()->all();
        return $events;
    }

    public function actionView($code)
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

        return [
            'event' => $event,
            'guests' => $guests,
            'statistics' => [
                'total_guests' => count($guests),
                'accepted' => count(array_filter($guests, fn($g) => $g->status === 'accepted')),
                'declined' => count(array_filter($guests, fn($g) => $g->status === 'declined')),
                'pending' => count(array_filter($guests, fn($g) => $g->status === 'pending')),
                'total_children' => array_sum(array_map(fn($g) => $g->children_count, $guests)),
            ]
        ];
    }

    public function actionCreate()
    {
        $event = new Event();
        $event->load(Yii::$app->request->post(), '');
        
        if ($event->save()) {
            Yii::$app->response->statusCode = 201;
            return $event;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $event->errors];
        }
    }

    public function actionUpdate($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Event not found'];
        }

        $event->load(Yii::$app->request->bodyParams, '');
        
        if ($event->save()) {
            return $event;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $event->errors];
        }
    }

    public function actionDelete($code)
    {
        $event = Event::find()->where(['unique_code' => $code])->one();
        
        if (!$event) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Event not found'];
        }

        if ($event->delete()) {
            Yii::$app->response->statusCode = 204;
            return null;
        } else {
            Yii::$app->response->statusCode = 500;
            return ['error' => 'Failed to delete event'];
        }
    }
}