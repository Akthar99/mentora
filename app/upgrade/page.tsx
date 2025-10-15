'use client';

import { Check, X, Lock, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function UpgradePage() {
  const router = useRouter();

  const tiers = [
    {
      name: 'Freemium',
      price: 'Free',
      priceAmount: 0,
      popular: false,
      features: [
        { text: '100 uploads per week', included: true },
        { text: '0 exports per month', included: false },
        { text: 'No exam paper generation', included: false },
        { text: 'Basic templates', included: true },
      ],
      buttonText: 'Current Plan',
      buttonVariant: 'outline',
    },
    {
      name: 'Pro',
      price: '$19',
      priceAmount: 19,
      period: '/month',
      popular: true,
      features: [
        { text: 'Unlimited uploads', included: true },
        { text: '100 exports per month', included: true },
        { text: 'Exam paper generation', included: true },
        { text: 'Advanced templates', included: true },
        { text: 'Priority support', included: true },
      ],
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'primary',
    },
    {
      name: 'Premium',
      price: '$49',
      priceAmount: 49,
      period: '/month',
      popular: false,
      features: [
        { text: 'Unlimited uploads', included: true },
        { text: '500+ exports per month', included: true },
        { text: 'Advanced exam generation', included: true },
        { text: 'Custom branding', included: true },
        { text: 'White-label solution', included: true },
        { text: 'Dedicated support', included: true },
      ],
      buttonText: 'Upgrade to Premium',
      buttonVariant: 'dark',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Generate comprehensive exam papers in minutes instead of hours',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Smart question generation based on curriculum standards',
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Track student performance and identify learning gaps',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-blue-600 rounded-2xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Unlock Exam Paper Generation</h1>
              <p className="text-blue-100">
                Upgrade to Pro or Premium to access our powerful exam paper creation tools
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-6">
            <Lock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Exam Paper Generator</span>
          </div>

          <h2 className="text-4xl font-bold mb-4 text-gray-900">Exam Paper Generator</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Create professional exam papers and model papers with our AI-powered generator.
            Perfect for teachers and educators to build comprehensive assessments for any subject
            or exam type.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-3">What you can do with Exam Paper Generator:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Generate custom exam papers</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple question formats</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Difficulty level customization</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-3 opacity-0">Placeholder</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Create model answer sheets</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-marking capabilities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 ${
                tier.popular
                  ? 'bg-blue-600 text-white shadow-2xl scale-105'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-400 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`text-sm ${tier.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-blue-200' : 'text-green-600'}`} />
                    ) : (
                      <X className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-blue-300' : 'text-gray-400'}`} />
                    )}
                    <span className={`text-sm ${tier.popular ? 'text-blue-50' : 'text-gray-700'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (tier.buttonVariant !== 'outline') {
                    router.push('/mark-papers');
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  tier.buttonVariant === 'primary'
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : tier.buttonVariant === 'dark'
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Teachers Love Our Exam Paper Generator
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
