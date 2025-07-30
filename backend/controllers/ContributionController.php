<?php

namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\filters\ContentNegotiator;
use yii\web\Response;
use yii\filters\Cors;
use app\models\Contribution;
use app\models\Guest;

class ContributionController extends ActiveController
{
    public $modelClass = 'app\models\Contribution';

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

    public function actionIndex($token)
    {
        $guest = Guest::find()->where(['unique_token' => $token])->one();
        
        if (!$guest) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Guest not found'];
        }

        $contributions = Contribution::find()
            ->where(['guest_id' => $guest->id])
            ->all();

        return $contributions;
    }

    public function actionCreate($token)
    {
        $guest = Guest::find()->where(['unique_token' => $token])->one();
        
        if (!$guest) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Guest not found'];
        }

        $contribution = new Contribution();
        $contribution->guest_id = $guest->id;
        $contribution->event_id = $guest->event_id;
        $contribution->load(Yii::$app->request->post(), '');
        
        if ($contribution->save()) {
            Yii::$app->response->statusCode = 201;
            return $contribution;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $contribution->errors];
        }
    }

    public function actionUpdate($id)
    {
        $contribution = Contribution::findOne($id);
        
        if (!$contribution) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Contribution not found'];
        }

        $contribution->load(Yii::$app->request->bodyParams, '');
        
        if ($contribution->save()) {
            return $contribution;
        } else {
            Yii::$app->response->statusCode = 422;
            return ['errors' => $contribution->errors];
        }
    }

    public function actionDelete($id)
    {
        $contribution = Contribution::findOne($id);
        
        if (!$contribution) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Contribution not found'];
        }

        if ($contribution->delete()) {
            Yii::$app->response->statusCode = 204;
            return null;
        } else {
            Yii::$app->response->statusCode = 500;
            return ['error' => 'Failed to delete contribution'];
        }
    }
}