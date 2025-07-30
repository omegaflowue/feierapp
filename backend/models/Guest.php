<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;
use yii\db\Expression;

class Guest extends ActiveRecord
{
    public static function tableName()
    {
        return 'guests';
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
            [['event_id', 'name'], 'required'],
            [['event_id', 'children_count'], 'integer'],
            [['dietary_restrictions', 'special_notes'], 'string'],
            [['name'], 'string', 'max' => 255],
            [['email'], 'email'],
            [['phone'], 'string', 'max' => 50],
            [['unique_token'], 'string', 'max' => 64],
            [['unique_token'], 'unique'],
            [['status'], 'in', 'range' => ['pending', 'accepted', 'declined']],
            [['children_count'], 'integer', 'min' => 0],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'event_id' => 'Event ID',
            'name' => 'Name',
            'email' => 'E-Mail',
            'phone' => 'Telefon',
            'unique_token' => 'Token',
            'status' => 'Status',
            'children_count' => 'Anzahl Kinder',
            'dietary_restrictions' => 'Unverträglichkeiten',
            'special_notes' => 'Besondere Hinweise',
            'created_at' => 'Erstellt am',
            'updated_at' => 'Aktualisiert am',
        ];
    }

    public function getEvent()
    {
        return $this->hasOne(Event::class, ['id' => 'event_id']);
    }

    public function getContributions()
    {
        return $this->hasMany(Contribution::class, ['guest_id' => 'id']);
    }

    public function getInvitations()
    {
        return $this->hasMany(Invitation::class, ['guest_id' => 'id']);
    }

    public function beforeSave($insert)
    {
        if (parent::beforeSave($insert)) {
            if ($insert && empty($this->unique_token)) {
                $this->unique_token = $this->generateUniqueToken();
            }
            return true;
        }
        return false;
    }

    private function generateUniqueToken()
    {
        do {
            $token = bin2hex(random_bytes(32));
        } while (self::find()->where(['unique_token' => $token])->exists());
        
        return $token;
    }

    public function fields()
    {
        return [
            'id',
            'event_id',
            'name',
            'email',
            'phone',
            'unique_token',
            'status',
            'children_count',
            'dietary_restrictions',
            'special_notes',
            'created_at',
            'updated_at',
        ];
    }
}