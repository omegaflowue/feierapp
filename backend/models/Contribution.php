<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;
use yii\db\Expression;

class Contribution extends ActiveRecord
{
    public static function tableName()
    {
        return 'contributions';
    }

    public function behaviors()
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'created_at',
                'updatedAtAttribute' => null,
                'value' => new Expression('NOW()'),
            ],
        ];
    }

    public function rules()
    {
        return [
            [['guest_id', 'event_id', 'type', 'item'], 'required'],
            [['guest_id', 'event_id'], 'integer'],
            [['notes'], 'string'],
            [['type'], 'in', 'range' => ['food', 'drink', 'other']],
            [['item'], 'string', 'max' => 255],
            [['quantity'], 'string', 'max' => 100],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'guest_id' => 'Gast ID',
            'event_id' => 'Event ID',
            'type' => 'Typ',
            'item' => 'Artikel',
            'quantity' => 'Menge',
            'notes' => 'Notizen',
            'created_at' => 'Erstellt am',
        ];
    }

    public function getGuest()
    {
        return $this->hasOne(Guest::class, ['id' => 'guest_id']);
    }

    public function getEvent()
    {
        return $this->hasOne(Event::class, ['id' => 'event_id']);
    }

    public function fields()
    {
        return [
            'id',
            'guest_id',
            'event_id',
            'type',
            'item',
            'quantity',
            'notes',
            'created_at',
        ];
    }
}