import { motion } from 'framer-motion';
import RetrievePanel from '@/components/share/RetrievePanel';

export default function RetrievePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <RetrievePanel />
        </motion.div>
      </div>
    </div>
  );
}
