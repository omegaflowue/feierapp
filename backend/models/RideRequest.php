<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;

/**
 * This is the model class for table "ride_requests".
 *
 * @property int $id
 * @property int $event_id
 * @property int $passenger_guest_id
 * @property string $pickup_location
 * @property bool $flexible_pickup
 * @property int $passenger_count
 * @property string|null $notes
 * @property string $status
 * @property string $created_at
 * @property string $updated_at
 *
 * @property Event $event
 * @property Guest $passengerGuest
 * @property RideMatch[] $rideMatches
 */
class RideRequest extends ActiveRecord
{
    const STATUS_OPEN = 'open';
    const STATUS_MATCHED = 'matched';
    const STATUS_CANCELLED = 'cancelled';

    public static function tableName()
    {
        return 'ride_requests';
    }

    public function behaviors()
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'created_at',
                'updatedAtAttribute' => 'updated_at',
                'value' => function() {
                    return date('Y-m-d H:i:s');
                }
            ],
        ];
    }

    public function rules()
    {
        return [
            [['event_id', 'passenger_guest_id', 'pickup_location'], 'required'],
            [['event_id', 'passenger_guest_id', 'passenger_count'], 'integer'],
            [['flexible_pickup'], 'boolean'],
            [['notes'], 'string'],
            [['created_at', 'updated_at'], 'safe'],
            [['passenger_count'], 'integer', 'min' => 1, 'max' => 6],
            [['pickup_location'], 'string', 'max' => 500],
            [['status'], 'in', 'range' => [self::STATUS_OPEN, self::STATUS_MATCHED, self::STATUS_CANCELLED]],
            [['status'], 'default', 'value' => self::STATUS_OPEN],
            [['flexible_pickup'], 'default', 'value' => false],
            [['passenger_count'], 'default', 'value' => 1],
            [['event_id'], 'exist', 'skipOnError' => true, 'targetClass' => Event::class, 'targetAttribute' => ['event_id' => 'id']],
            [['passenger_guest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Guest::class, 'targetAttribute' => ['passenger_guest_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'event_id' => 'Event ID',
            'passenger_guest_id' => 'Passenger Guest ID',
            'pickup_location' => 'Pickup Location',
            'flexible_pickup' => 'Flexible Pickup',
            'passenger_count' => 'Passenger Count',
            'notes' => 'Notes',
            'status' => 'Status',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
        ];
    }

    public function getEvent()
    {
        return $this->hasOne(Event::class, ['id' => 'event_id']);
    }

    public function getPassengerGuest()
    {
        return $this->hasOne(Guest::class, ['id' => 'passenger_guest_id']);
    }

    public function getRideMatches()
    {
        return $this->hasMany(RideMatch::class, ['ride_request_id' => 'id']);
    }

    public function getConfirmedMatch()
    {
        return $this->hasOne(RideMatch::class, ['ride_request_id' => 'id'])
            ->where(['status' => RideMatch::STATUS_CONFIRMED]);
    }

    public function updateStatus()
    {
        $confirmedMatch = $this->getConfirmedMatch()->one();
        if ($confirmedMatch) {
            $this->status = self::STATUS_MATCHED;
        } elseif ($this->status === self::STATUS_MATCHED && !$confirmedMatch) {
            $this->status = self::STATUS_OPEN;
        }
        return $this->save(false, ['status', 'updated_at']);
    }

    public function fields()
    {
        return [
            'id',
            'event_id',
            'passenger_guest_id',
            'pickup_location',
            'flexible_pickup',
            'passenger_count',
            'notes',
            'status',
            'created_at',
            'updated_at',
            'passenger' => function() { return $this->passengerGuest; },
            'confirmed_match' => function() { return $this->getConfirmedMatch()->one(); },
        ];
    }
}