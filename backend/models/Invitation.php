<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;
use yii\db\Expression;

class Invitation extends ActiveRecord
{
    public static function tableName()
    {
        return 'invitations';
    }

    public function behaviors()
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'sent_at',
                'updatedAtAttribute' => null,
                'value' => new Expression('NOW()'),
            ],
        ];
    }

    public function rules()
    {
        return [
            [['event_id', 'guest_id'], 'required'],
            [['event_id', 'guest_id'], 'integer'],
            [['sent_at', 'opened_at', 'responded_at'], 'datetime', 'format' => 'php:Y-m-d H:i:s'],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'event_id' => 'Event ID',
            'guest_id' => 'Gast ID',
            'sent_at' => 'Gesendet am',
            'opened_at' => 'Geöffnet am',
            'responded_at' => 'Geantwortet am',
        ];
    }

    public function getEvent()
    {
        return $this->hasOne(Event::class, ['id' => 'event_id']);
    }

    public function getGuest()
    {
        return $this->hasOne(Guest::class, ['id' => 'guest_id']);
    }

    public function fields()
    {
        return [
            'id',
            'event_id',
            'guest_id',
            'sent_at',
            'opened_at',
            'responded_at',
        ];
    }
}