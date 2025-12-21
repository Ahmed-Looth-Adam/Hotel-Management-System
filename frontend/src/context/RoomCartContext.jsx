/**
 * Room Cart Context - Manages selected room types for multi-room reservations
 *
 * RESTRICTIONS:
 * - All rooms in a single reservation must be from the same hotel
 * - All rooms share the SAME check-in/check-out dates
 *
 * Cart items are stored by room TYPE (not specific room ID):
 * - hotel_id + room_type = unique cart item
 * - Each item has a quantity (number of rooms)
 * - Backend assigns specific rooms at booking time
 */

import { createContext, useContext, useState, useCallback } from 'react';

const RoomCartContext = createContext(null);

// Ancillary service prices (GBP)
export const ANCILLARY_SERVICES = [
  { id: 'airport_transfer', label: 'Airport Transfer (One-way)', price: 50, perPerson: false, perNight: false },
  { id: 'breakfast', label: 'Full English Breakfast', price: 20, perPerson: true, perNight: true },
  { id: 'spa', label: 'Spa Access', price: 35, perPerson: true, perNight: true },
  { id: 'late_checkout', label: 'Late Check-out (until 2 PM)', price: 40, perPerson: false, perNight: false },
];

// Generate unique key for cart item (NO dates - dates are shared across all rooms)
const generateCartKey = (hotelId, roomTypeCategory) => {
  return `${hotelId}_${roomTypeCategory}`;
};

export const useRoomCart = () => {
  const context = useContext(RoomCartContext);
  if (!context) {
    throw new Error('useRoomCart must be used within a RoomCartProvider');
  }
  return context;
};

export const RoomCartProvider = ({ children }) => {
  // Cart items keyed by unique identifier (hotel_id + room_type)
  const [cartItems, setCartItems] = useState({});

  // Shared reservation dates for ALL rooms in cart
  const [reservationDates, setReservationDates] = useState({
    checkIn: null,
    checkOut: null,
  });

  /**
   * Get the shared reservation dates
   */
  const getReservationDates = useCallback(() => {
    return reservationDates;
  }, [reservationDates]);

  /**
   * Update reservation dates for ALL rooms
   */
  const updateReservationDates = useCallback((checkIn, checkOut) => {
    setReservationDates({ checkIn, checkOut });
  }, []);

  /**
   * Get the hotel ID currently in cart (null if empty)
   */
  const getCartHotelId = useCallback(() => {
    const items = Object.values(cartItems);
    if (items.length === 0) return null;
    return items[0].hotel_id;
  }, [cartItems]);

  /**
   * Get hotel info from cart
   */
  const getCartHotel = useCallback(() => {
    const items = Object.values(cartItems);
    if (items.length === 0) return null;
    return {
      hotel_id: items[0].hotel_id,
      hotel_name: items[0].hotel_name,
      hotel_city: items[0].hotel_city,
      hotel_country: items[0].hotel_country,
    };
  }, [cartItems]);

  /**
   * Check if a hotel can be added to cart (same hotel or empty cart)
   */
  const canAddToCart = useCallback((hotelId) => {
    const currentHotelId = getCartHotelId();
    return currentHotelId === null || currentHotelId === hotelId;
  }, [getCartHotelId]);

  /**
   * Add a room type to cart or increment quantity
   * RESTRICTIONS:
   * - Only allows adding rooms from the same hotel
   * - All rooms share the same check-in/check-out dates
   *
   * @param {Object} roomTypeInfo - Room type details
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @param {number} guests - Guests per room
   * @param {number} quantity - Number of rooms to add (default 1)
   * @param {number} maxAvailable - Maximum available rooms of this type
   * @param {Array} services - Selected ancillary services (default [])
   * @returns {Object} - { success: boolean, error?: string, datesUpdated?: boolean }
   */
  const addToCart = useCallback((roomTypeInfo, checkIn, checkOut, guests = 2, quantity = 1, maxAvailable = 10, services = []) => {
    const currentItems = Object.values(cartItems);

    // Check single-hotel restriction
    if (currentItems.length > 0 && currentItems[0].hotel_id !== roomTypeInfo.hotel_id) {
      return {
        success: false,
        error: 'different_hotel',
        currentHotel: {
          hotel_id: currentItems[0].hotel_id,
          hotel_name: currentItems[0].hotel_name,
        },
      };
    }

    // Determine dates to use
    let finalCheckIn = checkIn;
    let finalCheckOut = checkOut;
    let datesUpdated = false;

    if (currentItems.length > 0 && reservationDates.checkIn && reservationDates.checkOut) {
      // Use existing reservation dates (dates are shared)
      if (checkIn !== reservationDates.checkIn || checkOut !== reservationDates.checkOut) {
        datesUpdated = true;
      }
      finalCheckIn = reservationDates.checkIn;
      finalCheckOut = reservationDates.checkOut;
    } else {
      // First item - set reservation dates
      setReservationDates({ checkIn, checkOut });
    }

    const key = generateCartKey(roomTypeInfo.hotel_id, roomTypeInfo.room_type_category);

    setCartItems((prev) => {
      const existing = prev[key];
      if (existing) {
        // Increment quantity up to max available
        const newQuantity = Math.min(existing.quantity + quantity, maxAvailable);
        // Merge services (add new ones that don't already exist)
        const mergedServices = [...new Set([...existing.ancillary_services, ...services])];
        return {
          ...prev,
          [key]: { ...existing, quantity: newQuantity, max_available: maxAvailable, ancillary_services: mergedServices },
        };
      }

      // Add new item (NO per-item dates - dates come from reservationDates)
      return {
        ...prev,
        [key]: {
          key,
          hotel_id: roomTypeInfo.hotel_id,
          hotel_name: roomTypeInfo.hotel_name,
          hotel_city: roomTypeInfo.hotel_city,
          hotel_country: roomTypeInfo.hotel_country,
          room_type_category: roomTypeInfo.room_type_category,
          room_type_label: roomTypeInfo.room_type_label,
          price_per_night: parseFloat(roomTypeInfo.price_per_night || 0),
          image: roomTypeInfo.image,
          guests_per_room: guests,
          quantity: Math.min(quantity, maxAvailable),
          max_available: maxAvailable,
          ancillary_services: services,
          special_requests: '',
        },
      };
    });

    return { success: true, datesUpdated };
  }, [cartItems, reservationDates]);

  /**
   * Update quantity for a cart item
   */
  const updateQuantity = useCallback((key, newQuantity) => {
    setCartItems((prev) => {
      const item = prev[key];
      if (!item) return prev;

      if (newQuantity <= 0) {
        // Remove item
        const { [key]: removed, ...rest } = prev;
        // If cart becomes empty, clear reservation dates
        if (Object.keys(rest).length === 0) {
          setReservationDates({ checkIn: null, checkOut: null });
        }
        return rest;
      }

      // Update quantity (respect max available)
      return {
        ...prev,
        [key]: {
          ...item,
          quantity: Math.min(newQuantity, item.max_available),
        },
      };
    });
  }, []);

  /**
   * Remove an item from cart
   */
  const removeFromCart = useCallback((key) => {
    setCartItems((prev) => {
      const { [key]: removed, ...rest } = prev;
      // If cart becomes empty, clear reservation dates
      if (Object.keys(rest).length === 0) {
        setReservationDates({ checkIn: null, checkOut: null });
      }
      return rest;
    });
  }, []);

  /**
   * Update cart item (services, special requests, etc.)
   */
  const updateCartItem = useCallback((key, updates) => {
    setCartItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      return {
        ...prev,
        [key]: { ...item, ...updates },
      };
    });
  }, []);

  /**
   * Toggle a service for a cart item
   */
  const toggleService = useCallback((key, serviceId) => {
    setCartItems((prev) => {
      const item = prev[key];
      if (!item) return prev;

      const services = item.ancillary_services || [];
      const hasService = services.includes(serviceId);

      return {
        ...prev,
        [key]: {
          ...item,
          ancillary_services: hasService
            ? services.filter((s) => s !== serviceId)
            : [...services, serviceId],
        },
      };
    });
  }, []);

  /**
   * Get quantity of a specific room type in cart
   */
  const getQuantityInCart = useCallback((hotelId, roomTypeCategory) => {
    const key = generateCartKey(hotelId, roomTypeCategory);
    return cartItems[key]?.quantity || 0;
  }, [cartItems]);

  /**
   * Check if a room type is in cart
   */
  const isInCart = useCallback((hotelId, roomTypeCategory) => {
    const key = generateCartKey(hotelId, roomTypeCategory);
    return !!cartItems[key];
  }, [cartItems]);

  /**
   * Clear the cart
   */
  const clearCart = useCallback(() => {
    setCartItems({});
    setReservationDates({ checkIn: null, checkOut: null });
  }, []);

  /**
   * Get cart items as array
   */
  const getCartItemsArray = useCallback(() => {
    return Object.values(cartItems);
  }, [cartItems]);

  /**
   * Calculate number of nights from reservation dates
   */
  const calculateNights = useCallback(() => {
    if (!reservationDates.checkIn || !reservationDates.checkOut) return 0;
    const start = new Date(reservationDates.checkIn);
    const end = new Date(reservationDates.checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [reservationDates]);

  /**
   * Calculate services total for a cart item (per room)
   */
  const calculateItemServicesTotal = useCallback((item) => {
    const nights = calculateNights();
    const guests = item.guests_per_room || 2;
    const services = item.ancillary_services || [];

    return services.reduce((total, serviceId) => {
      const service = ANCILLARY_SERVICES.find((s) => s.id === serviceId);
      if (!service) return total;

      let price = service.price;
      if (service.perPerson) price *= guests;
      if (service.perNight) price *= nights;
      return total + price;
    }, 0);
  }, [calculateNights]);

  /**
   * Calculate total price for a cart item (room + services) * quantity
   */
  const calculateItemTotal = useCallback((item) => {
    const nights = calculateNights();
    const roomPricePerUnit = (item.price_per_night || 0) * nights;
    const servicesPricePerUnit = calculateItemServicesTotal(item);
    const pricePerUnit = roomPricePerUnit + servicesPricePerUnit;
    return pricePerUnit * item.quantity;
  }, [calculateNights, calculateItemServicesTotal]);

  /**
   * Calculate total price for entire cart
   */
  const getCartTotal = useCallback(() => {
    return Object.values(cartItems).reduce((total, item) => total + calculateItemTotal(item), 0);
  }, [cartItems, calculateItemTotal]);

  /**
   * Get total number of rooms in cart
   */
  const getTotalRooms = useCallback(() => {
    return Object.values(cartItems).reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  /**
   * Get total guests across all rooms
   */
  const getTotalGuests = useCallback(() => {
    return Object.values(cartItems).reduce((total, item) => {
      return total + (item.guests_per_room || 2) * item.quantity;
    }, 0);
  }, [cartItems]);

  /**
   * Get items grouped by hotel (for display - though now only one hotel allowed)
   */
  const getItemsByHotel = useCallback(() => {
    const grouped = {};
    Object.values(cartItems).forEach((item) => {
      const hotelId = item.hotel_id || 'unknown';
      if (!grouped[hotelId]) {
        grouped[hotelId] = {
          hotel_id: hotelId,
          hotel_name: item.hotel_name,
          hotel_city: item.hotel_city,
          hotel_country: item.hotel_country,
          items: [],
        };
      }
      grouped[hotelId].items.push(item);
    });
    return Object.values(grouped);
  }, [cartItems]);

  /**
   * Format cart data for API submission
   */
  const getCartDataForAPI = useCallback(() => {
    const rooms = [];
    Object.values(cartItems).forEach((item) => {
      // Create one entry per room (expand quantity)
      for (let i = 0; i < item.quantity; i++) {
        rooms.push({
          hotel_id: item.hotel_id,
          room_type_category: item.room_type_category,
          check_in_date: reservationDates.checkIn,
          check_out_date: reservationDates.checkOut,
          guests_count: item.guests_per_room,
          price_per_night: item.price_per_night,
          ancillary_services: item.ancillary_services || [],
          special_requests: item.special_requests || '',
        });
      }
    });
    return rooms;
  }, [cartItems, reservationDates]);

  const value = {
    cartItems,
    reservationDates,
    addToCart,
    updateQuantity,
    removeFromCart,
    updateCartItem,
    toggleService,
    getQuantityInCart,
    isInCart,
    clearCart,
    getCartItemsArray,
    calculateNights,
    calculateItemServicesTotal,
    calculateItemTotal,
    getCartTotal,
    getTotalRooms,
    getTotalGuests,
    getItemsByHotel,
    getCartDataForAPI,
    // Reservation dates helpers
    getReservationDates,
    updateReservationDates,
    // Single-hotel restriction helpers
    getCartHotelId,
    getCartHotel,
    canAddToCart,
    roomCount: getTotalRooms(),
    ANCILLARY_SERVICES,
    generateCartKey,
  };

  return (
    <RoomCartContext.Provider value={value}>{children}</RoomCartContext.Provider>
  );
};

export default RoomCartContext;
