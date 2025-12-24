import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const AISuggestionBanner = () => {
  const { getAISuggestion } = useQueue();
  const navigate = useNavigate();
  const suggestion = getAISuggestion();

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl gradient-ai p-4 text-primary-foreground shadow-lg"
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      
      <div className="relative">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-white/20 rounded-xl"
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-sm mb-1 flex items-center gap-2">
              <span>Smart Tip</span>
            </h3>
            <motion.p 
              key={suggestion.message}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-primary-foreground/90 leading-relaxed"
            >
              ✨ {suggestion.message}
            </motion.p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/map')}
          className="mt-3 bg-white/20 hover:bg-white/30 text-primary-foreground border-0 w-full font-medium"
        >
          View on Map
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
