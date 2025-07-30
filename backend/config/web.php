<?php

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

$config = [
    'id' => 'feierapp-api',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            'cookieValidationKey' => 'your-secret-key-here',
            'enableCsrfValidation' => false,
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ]
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'user' => [
            'identityClass' => 'app\models\User',
            'enableAutoLogin' => false,
            'enableSession' => false,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'mailer' => [
            'class' => 'yii\swiftmailer\Mailer',
            'useFileTransport' => true,
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
        'urlManager' => [
            'enablePrettyUrl' => true,
            'enableStrictParsing' => true,
            'showScriptName' => false,
            'rules' => [
                'GET events' => 'event/index',
                'POST events' => 'event/create',
                'GET events/<code:[a-zA-Z0-9]+>' => 'event/view',
                'PUT events/<code:[a-zA-Z0-9]+>' => 'event/update',
                'DELETE events/<code:[a-zA-Z0-9]+>' => 'event/delete',
                
                'GET events/<code:[a-zA-Z0-9]+>/guests' => 'guest/index',
                'POST events/<code:[a-zA-Z0-9]+>/guests' => 'guest/create',
                'GET guests/<token:[a-zA-Z0-9]+>' => 'guest/view',
                'PUT guests/<token:[a-zA-Z0-9]+>' => 'guest/update',
                
                'GET guests/<token:[a-zA-Z0-9]+>/contributions' => 'contribution/index',
                'POST guests/<token:[a-zA-Z0-9]+>/contributions' => 'contribution/create',
                'PUT contributions/<id:\d+>' => 'contribution/update',
                'DELETE contributions/<id:\d+>' => 'contribution/delete',
            ],
        ],
        'response' => [
            'format' => yii\web\Response::FORMAT_JSON,
            'charset' => 'UTF-8',
        ],
    ],
    'params' => $params,
];

if (YII_ENV_DEV) {
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => 'yii\debug\Module',
        'allowedIPs' => ['127.0.0.1', '::1'],
    ];

    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => 'yii\gii\Module',
        'allowedIPs' => ['127.0.0.1', '::1'],
    ];
}

return $config;