<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;

/**
 * This is the model class for table "ride_offers".
 *
 * @property int $id
 * @property int $event_id
 * @property int $driver_guest_id
 * @property string $departure_location
 * @property string $departure_time
 * @property int $available_seats
 * @property string|null $car_description
 * @property string|null $notes
 * @property string|null $contact_info
 * @property string $status
 * @property string $created_at
 * @property string $updated_at
 *
 * @property Event $event
 * @property Guest $driverGuest
 * @property RideMatch[] $rideMatches
 */
class RideOffer extends ActiveRecord
{
    const STATUS_ACTIVE = 'active';
    const STATUS_FULL = 'full';
    const STATUS_CANCELLED = 'cancelled';

    public static function tableName()
    {
        return 'ride_offers';
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
            [['event_id', 'driver_guest_id', 'departure_location', 'departure_time'], 'required'],
            [['event_id', 'driver_guest_id', 'available_seats'], 'integer'],
            [['departure_time', 'created_at', 'updated_at'], 'safe'],
            [['notes'], 'string'],
            [['available_seats'], 'integer', 'min' => 1, 'max' => 8],
            [['departure_location', 'pickup_location'], 'string', 'max' => 500],
            [['car_description', 'contact_info'], 'string', 'max' => 255],
            [['status'], 'in', 'range' => [self::STATUS_ACTIVE, self::STATUS_FULL, self::STATUS_CANCELLED]],
            [['status'], 'default', 'value' => self::STATUS_ACTIVE],
            [['event_id'], 'exist', 'skipOnError' => true, 'targetClass' => Event::class, 'targetAttribute' => ['event_id' => 'id']],
            [['driver_guest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Guest::class, 'targetAttribute' => ['driver_guest_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'event_id' => 'Event ID',
            'driver_guest_id' => 'Driver Guest ID',
            'departure_location' => 'Departure Location',
            'departure_time' => 'Departure Time',
            'available_seats' => 'Available Seats',
            'car_description' => 'Car Description',
            'notes' => 'Notes',
            'contact_info' => 'Contact Info',
            'status' => 'Status',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
        ];
    }

    public function getEvent()
    {
        return $this->hasOne(Event::class, ['id' => 'event_id']);
    }

    public function getDriverGuest()
    {
        return $this->hasOne(Guest::class, ['id' => 'driver_guest_id']);
    }

    public function getRideMatches()
    {
        return $this->hasMany(RideMatch::class, ['ride_offer_id' => 'id']);
    }

    public function getConfirmedMatches()
    {
        return $this->hasMany(RideMatch::class, ['ride_offer_id' => 'id'])
            ->where(['status' => RideMatch::STATUS_CONFIRMED]);
    }

    public function getRemainingSeats()
    {
        $confirmedMatches = $this->getConfirmedMatches()->count();
        return max(0, $this->available_seats - $confirmedMatches);
    }

    public function updateStatus()
    {
        if ($this->getRemainingSeats() <= 0) {
            $this->status = self::STATUS_FULL;
        } elseif ($this->status === self::STATUS_FULL && $this->getRemainingSeats() > 0) {
            $this->status = self::STATUS_ACTIVE;
        }
        return $this->save(false, ['status', 'updated_at']);
    }

    public function fields()
    {
        return [
            'id',
            'event_id',
            'driver_guest_id',
            'departure_location',
            'departure_time',
            'available_seats',
            'car_description',
            'notes',
            'contact_info',
            'status',
            'created_at',
            'updated_at',
            'remaining_seats' => function() { return $this->getRemainingSeats(); },
            'driver' => function() { return $this->driverGuest; },
            'confirmed_matches_count' => function() { return $this->getConfirmedMatches()->count(); },
        ];
    }
}