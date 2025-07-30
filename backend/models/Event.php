<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;
use yii\db\Expression;

class Event extends ActiveRecord
{
    public static function tableName()
    {
        return 'events';
    }

    public function behaviors()
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'created_at',
                'updatedAtAttribute' => 'updated_at',
                'value' => new Expression('NOW()'),
            ],
        ];
    }

    public function rules()
    {
        return [
            [['title', 'event_date', 'location', 'planner_name', 'planner_email'], 'required'],
            [['description'], 'string'],
            [['event_date'], 'datetime', 'format' => 'php:Y-m-d H:i:s'],
            [['title'], 'string', 'max' => 255],
            [['location'], 'string', 'max' => 500],
            [['planner_name'], 'string', 'max' => 255],
            [['planner_email'], 'email'],
            [['planner_phone'], 'string', 'max' => 50],
            [['unique_code'], 'string', 'max' => 32],
            [['unique_code'], 'unique'],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'title' => 'Titel',
            'description' => 'Beschreibung',
            'event_date' => 'Datum & Uhrzeit',
            'location' => 'Ort',
            'planner_name' => 'Planer Name',
            'planner_email' => 'Planer E-Mail',
            'planner_phone' => 'Planer Telefon',
            'unique_code' => 'Event Code',
            'created_at' => 'Erstellt am',
            'updated_at' => 'Aktualisiert am',
        ];
    }

    public function getGuests()
    {
        return $this->hasMany(Guest::class, ['event_id' => 'id']);
    }

    public function getInvitations()
    {
        return $this->hasMany(Invitation::class, ['event_id' => 'id']);
    }

    public function beforeSave($insert)
    {
        if (parent::beforeSave($insert)) {
            if ($insert && empty($this->unique_code)) {
                $this->unique_code = $this->generateUniqueCode();
            }
            return true;
        }
        return false;
    }

    private function generateUniqueCode()
    {
        do {
            $code = substr(md5(uniqid(rand(), true)), 0, 12);
        } while (self::find()->where(['unique_code' => $code])->exists());
        
        return $code;
    }

    public function fields()
    {
        return [
            'id',
            'title',
            'description',
            'event_date',
            'location',
            'planner_name',
            'planner_email',
            'planner_phone',
            'unique_code',
            'created_at',
            'updated_at',
        ];
    }
}