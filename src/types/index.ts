export interface Ride {
  id: string;
  driverName: string;
  phoneNumber: string;
  vehicleNumber: string;
  fromLocation: string;
  toLocation: string;
  travelDate: string;
  bookingNeed: 'every_day' | 'today_only' | 'specific_date';
  price?: string;
  priceType: 'fixed' | 'negotiable';
  maxLuggage: number;
  createdAt: string;
}

export interface TravelerProfile {
  phoneNumber: string;
  createdAt: string;
}

export type RootTabParamList = {
  PublishRide: undefined;
  FindRide: undefined;
};
