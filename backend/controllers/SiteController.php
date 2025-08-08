<?php

namespace app\controllers;

use yii\web\Controller;
use yii\web\Response;

class SiteController extends Controller
{
    public function actionIndex()
    {
        return [
            'status' => 'success',
            'message' => 'Feierapp API is running',
            'version' => '1.0.0',
            'endpoints' => [
                'GET /events' => 'List all events',
                'POST /events' => 'Create new event',
                'GET /events/{code}' => 'Get event by code',
                'GET /events/{code}/guests' => 'List guests for event',
                'POST /events/{code}/guests' => 'Add guest to event',
                'GET /guests/{token}' => 'Get guest by token',
                'PUT /guests/{token}' => 'Update guest',
                'GET /guests/{token}/contributions' => 'List contributions',
                'POST /guests/{token}/contributions' => 'Add contribution'
            ]
        ];
    }

    public function actionError()
    {
        return [
            'status' => 'error',
            'message' => 'An error occurred'
        ];
    }
}