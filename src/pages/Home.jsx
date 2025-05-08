import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import MainFeature from '../components/MainFeature';
import getIcon from '../utils/iconUtils';

const Home = () => {
  const [showControls, setShowControls] = useState(true);
  const [topScores, setTopScores] = useState(() => {
    const saved = localStorage.getItem('slithersphere_top_scores');
    return saved ? JSON.parse(saved) : [];
  });

  const InfoIcon = getIcon("Info");
  const AwardIcon = getIcon("Award");
  const TrophyIcon = getIcon("Trophy");
  
  const addScore = (newScore) => {
    const updatedScores = [...topScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setTopScores(updatedScores);
    localStorage.setItem('slithersphere_top_scores', JSON.stringify(updatedScores));
    
    if (newScore.score > (topScores[0]?.score || 0)) {
      toast.success('🏆 New high score!', {
        position: "top-center",
        autoClose: 3000
      });
    }
  };

  const clearScores = () => {
    setTopScores([]);
    localStorage.removeItem('slithersphere_top_scores');
    toast.info('High scores have been reset');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-6 md:py-10"
    >
      <div className="mb-6 md:mb-10 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl mb-2 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          SlitherSphere
        </h1>
        <p className="text-sm md:text-base text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          A modern take on the classic Snake game. Navigate, eat, grow, and avoid collisions!
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <MainFeature onScoreSubmit={addScore} />
        </div>
        
        <div className="flex flex-col gap-6">
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-card"
            >
              <div className="flex items-center gap-2 mb-4 text-primary-dark dark:text-primary-light">
                <InfoIcon size={20} />
                <h3 className="font-semibold text-lg">How To Play</h3>
              </div>
              <ul className="space-y-3 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">⌨️</span>
                  <span>Use arrow keys or WASD to navigate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">🍎</span>
                  <span>Eat food to grow longer and score points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">⚠️</span>
                  <span>Avoid hitting walls and yourself</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">🚀</span>
                  <span>Snake speeds up as it grows longer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">💎</span>
                  <span>Occasional special items give bonus effects</span>
                </li>
              </ul>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-card flex-grow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-secondary-dark dark:text-secondary-light">
                <TrophyIcon size={20} />
                <h3 className="font-semibold text-lg">Top Scores</h3>
              </div>
              
              {topScores.length > 0 && (
                <button 
                  onClick={clearScores}
                  className="text-xs text-surface-500 hover:text-accent"
                >
                  Reset
                </button>
              )}
            </div>
            
            {topScores.length > 0 ? (
              <div className="space-y-3">
                {topScores.map((score, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30' 
                        : 'bg-surface-50 dark:bg-surface-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs
                        ${index === 0 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{score.playerName || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{score.score}</span>
                      {index === 0 && <AwardIcon size={16} className="text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                <p>No scores yet. Start playing!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;