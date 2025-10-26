'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Check, AlertCircle, Plus, Trash2, Calendar, Shield } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';

interface SavedCard {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cardType: string;
  isDefault: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Add card form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    // Load saved cards from localStorage
    const savedCards = localStorage.getItem('mentora_saved_cards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
  }, []);

  const getCardType = (number: string): string => {
    const firstDigit = number.charAt(0);
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'Mastercard';
    if (firstDigit === '3') return 'Amex';
    return 'Card';
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
      alert('Please fill in all card details');
      return;
    }

    setAddingCard(true);

    // Simulate card validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newCard: SavedCard = {
      id: Date.now().toString(),
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardholderName: cardholderName,
      expiryDate: expiryDate,
      cardType: getCardType(cardNumber.replace(/\s/g, '')),
      isDefault: cards.length === 0, // First card is default
    };

    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    localStorage.setItem('mentora_saved_cards', JSON.stringify(updatedCards));

    // Reset form
    setCardNumber('');
    setCardholderName('');
    setExpiryDate('');
    setCvv('');
    setShowAddCard(false);
    setAddingCard(false);

    alert('Card added successfully!');
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to remove this card?')) {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      localStorage.setItem('mentora_saved_cards', JSON.stringify(updatedCards));
    }
  };

  const handleSetDefaultCard = (cardId: string) => {
    const updatedCards = cards.map(card => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    setCards(updatedCards);
    localStorage.setItem('mentora_saved_cards', JSON.stringify(updatedCards));
  };

  const handleUpgradePlan = async (planName: string, planPrice: number) => {
    if (cards.length === 0) {
      alert('Please add a payment card first to upgrade your plan.');
      return;
    }

    if (!user) return;

    const confirmUpgrade = confirm(
      `Upgrade to ${planName} for $${planPrice}/month?\n\nYour card will be charged immediately.`
    );

    if (confirmUpgrade) {
      try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update user premium status in Firebase
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isPremium: true,
          plan: planName,
          planPrice: planPrice,
          upgradedAt: new Date().toISOString(),
        });

        alert(`Successfully upgraded to ${planName}! Welcome to Premium!`);
        router.push('/dashboard');
      } catch (error) {
        console.error('Error upgrading plan:', error);
        alert('Failed to upgrade plan. Please try again.');
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    const confirmCancel = confirm(
      'Are you sure you want to cancel your subscription?\n\nYou will lose access to premium features at the end of your billing period.'
    );

    if (confirmCancel) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isPremium: false,
          plan: 'Freemium',
          planPrice: 0,
          cancelledAt: new Date().toISOString(),
        });

        alert('Subscription cancelled successfully. You will retain access until the end of your billing period.');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please try again.');
      }
    }
  };

  const plans = [
    {
      name: 'Pro',
      price: 19,
      features: [
        'Unlimited uploads',
        '100 exports per month',
        'Exam paper generation',
        'Advanced templates',
        'Priority support',
      ],
    },
    {
      name: 'Premium',
      price: 49,
      features: [
        'Unlimited uploads',
        '500+ exports per month',
        'Advanced exam generation',
        'Custom branding',
        'White-label solution',
        'Dedicated support',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your payment methods and subscription plan</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userData?.isPremium ? (userData?.plan || 'Premium') : 'Freemium'}
                </span>
                {userData?.isPremium && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {userData?.isPremium 
                  ? `$${userData?.planPrice || 0}/month - Billed monthly`
                  : 'Free plan with limited features'}
              </p>
            </div>
            {userData?.isPremium && (
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base w-full sm:w-auto text-left sm:text-right"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Card
            </button>
          </div>

          {/* Add Card Form */}
          {showAddCard && (
            <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Card</h3>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Your card information is stored securely in your browser</span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={addingCard}
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {addingCard ? 'Adding...' : 'Add Card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Saved Cards */}
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-600 mb-4">Add a card to upgrade your plan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`border-2 rounded-lg p-4 flex items-center justify-between ${
                    card.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {card.cardType} •••• {card.cardNumber.slice(-4)}
                        </span>
                        {card.isDefault && (
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                        <span>{card.cardholderName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {card.expiryDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefaultCard(card.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade Plans */}
        {!userData?.isPremium && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upgrade Your Plan</h2>
            
            {cards.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Payment method required</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please add a payment card before upgrading your plan.
                  </p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition"
                >
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgradePlan(plan.name, plan.price)}
                    disabled={cards.length === 0}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      cards.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Upgrade to {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
