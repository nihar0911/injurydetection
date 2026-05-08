import React from 'react';
import GooglePayButton from '@google-pay/button-react';
import { Check, ShieldCheck, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { profile, user } = useAuth();

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment Successful', paymentData);
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          tier: 'pro'
        });
        alert('Welcome to Pro! Your account has been upgraded.');
        onClose();
      } catch (err) {
        console.error('Failed to upgrade:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 pt-12 space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <Zap className="w-3 h-3 fill-indigo-400" /> Upgrade Required
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-100 italic">Level Up Your <br /><span className="text-indigo-500">Recovery Game</span></h2>
                <p className="text-slate-400 text-sm">Unlock unlimited scans and professional-grade recovery planning.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-indigo-500/30 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4">
                     <div className="text-2xl font-black italic text-indigo-400">₹99<span className="text-[10px] font-bold text-slate-500">/mo</span></div>
                   </div>
                   
                   <div className="space-y-4">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" /> Pro Tier
                     </h3>
                     <ul className="space-y-3">
                       {[
                         'Unlimited AI Vision Scans',
                         'Full Medical Recovery Reports',
                         'Interactive Recovery Planner',
                         'Priority Emergency Alerts',
                         'Past Injury History Tracking'
                       ].map(feature => (
                         <li key={feature} className="flex items-center gap-3 text-xs text-slate-400">
                           <Check className="w-3 h-3 text-emerald-500" /> {feature}
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <GooglePayButton
                  environment="TEST"
                  paymentRequest={{
                    apiVersion: 2,
                    apiVersionMinor: 0,
                    allowedPaymentMethods: [
                      {
                        type: 'CARD',
                        parameters: {
                          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                          allowedCardNetworks: ['MASTERCARD', 'VISA'],
                        },
                        tokenizationSpecification: {
                          type: 'PAYMENT_GATEWAY',
                          parameters: {
                            gateway: 'example',
                            gatewayMerchantId: 'exampleGatewayMerchantId',
                          },
                        },
                      },
                    ],
                    merchantInfo: {
                      merchantId: '12345678901234567890',
                      merchantName: 'Athlete Recovery Pro',
                    },
                    transactionInfo: {
                      totalPriceStatus: 'FINAL',
                      totalPriceLabel: 'Total',
                      totalPrice: '99.00',
                      currencyCode: 'INR',
                      countryCode: 'IN',
                    },
                    shippingAddressRequired: false,
                    callbackIntents: ['PAYMENT_AUTHORIZATION'],
                  }}
                  onLoadPaymentData={handlePaymentSuccess}
                  onPaymentAuthorized={(paymentData) => {
                    return { transactionState: 'SUCCESS' };
                  }}
                  existingPaymentMethodRequired={false}
                  buttonColor="white"
                  buttonType="subscribe"
                  className="w-full !max-w-xs"
                />
                <p className="text-[10px] text-slate-600 font-mono text-center">
                  Secure transaction powered by Google Pay. <br />Cancel anytime in settings.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
