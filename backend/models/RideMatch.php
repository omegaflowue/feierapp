<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\behaviors\TimestampBehavior;

/**
 * This is the model class for table "ride_matches".
 *
 * @property int $id
 * @property int $ride_offer_id
 * @property int $ride_request_id
 * @property string $status
 * @property bool $driver_confirmed
 * @property bool $passenger_confirmed
 * @property string|null $pickup_location
 * @property string|null $pickup_time
 * @property string|null $notes
 * @property string $created_at
 * @property string $updated_at
 *
 * @property RideOffer $rideOffer
 * @property RideRequest $rideRequest
 */
class RideMatch extends ActiveRecord
{
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_DECLINED = 'declined';
    const STATUS_CANCELLED = 'cancelled';

    public static function tableName()
    {
        return 'ride_matches';
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
            [['ride_offer_id', 'ride_request_id'], 'required'],
            [['ride_offer_id', 'ride_request_id'], 'integer'],
            [['driver_confirmed', 'passenger_confirmed'], 'boolean'],
            [['pickup_time', 'created_at', 'updated_at'], 'safe'],
            [['notes'], 'string'],
            [['pickup_location'], 'string', 'max' => 500],
            [['status'], 'in', 'range' => [self::STATUS_PENDING, self::STATUS_CONFIRMED, self::STATUS_DECLINED, self::STATUS_CANCELLED]],
            [['status'], 'default', 'value' => self::STATUS_PENDING],
            [['driver_confirmed', 'passenger_confirmed'], 'default', 'value' => false],
            [['ride_offer_id'], 'exist', 'skipOnError' => true, 'targetClass' => RideOffer::class, 'targetAttribute' => ['ride_offer_id' => 'id']],
            [['ride_request_id'], 'exist', 'skipOnError' => true, 'targetClass' => RideRequest::class, 'targetAttribute' => ['ride_request_id' => 'id']],
            [['ride_offer_id', 'ride_request_id'], 'unique', 'targetAttribute' => ['ride_offer_id', 'ride_request_id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'ride_offer_id' => 'Ride Offer ID',
            'ride_request_id' => 'Ride Request ID',
            'status' => 'Status',
            'driver_confirmed' => 'Driver Confirmed',
            'passenger_confirmed' => 'Passenger Confirmed',
            'pickup_location' => 'Pickup Location',
            'pickup_time' => 'Pickup Time',
            'notes' => 'Notes',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
        ];
    }

    public function getRideOffer()
    {
        return $this->hasOne(RideOffer::class, ['id' => 'ride_offer_id']);
    }

    public function getRideRequest()
    {
        return $this->hasOne(RideRequest::class, ['id' => 'ride_request_id']);
    }

    public function afterSave($insert, $changedAttributes)
    {
        parent::afterSave($insert, $changedAttributes);
        
        // Update status of related offer and request when match status changes
        if (isset($changedAttributes['status']) || isset($changedAttributes['driver_confirmed']) || isset($changedAttributes['passenger_confirmed'])) {
            $this->updateMatchStatus();
            $this->rideOffer->updateStatus();
            $this->rideRequest->updateStatus();
        }
    }

    public function updateMatchStatus()
    {
        if ($this->driver_confirmed && $this->passenger_confirmed) {
            $this->status = self::STATUS_CONFIRMED;
        } elseif ($this->status === self::STATUS_PENDING && ($this->driver_confirmed === false || $this->passenger_confirmed === false)) {
            // If either party explicitly declined
            $this->status = self::STATUS_DECLINED;
        }
        
        return $this->save(false, ['status', 'updated_at']);
    }

    public function confirmByDriver()
    {
        $this->driver_confirmed = true;
        $this->updateMatchStatus();
        return $this->save();
    }

    public function confirmByPassenger()
    {
        $this->passenger_confirmed = true;
        $this->updateMatchStatus();
        return $this->save();
    }

    public function decline()
    {
        $this->status = self::STATUS_DECLINED;
        return $this->save();
    }

    public function cancel()
    {
        $this->status = self::STATUS_CANCELLED;
        return $this->save();
    }

    public function fields()
    {
        return [
            'id',
            'ride_offer_id',
            'ride_request_id',
            'status',
            'driver_confirmed',
            'passenger_confirmed',
            'pickup_location',
            'pickup_time',
            'notes',
            'created_at',
            'updated_at',
            'ride_offer' => function() { return $this->rideOffer; },
            'ride_request' => function() { return $this->rideRequest; },
        ];
    }
}