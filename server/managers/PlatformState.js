class PlatformState {
  constructor() {
    this.globalGameConfig = {
      gridSize: 10,
      maxTreasures: 10,
      pointsPerTreasure: 50,
      winCondition: 'all_treasures'
    };
    this.globalAnalytics = {
      totalGamesPlayed: 0,
      teamAWins: 0,
      teamBWins: 0,
      treasuresFound: 0
    };
  }

  updateConfig(newConfig) {
    if (newConfig.gridSize) this.globalGameConfig.gridSize = newConfig.gridSize;
    if (newConfig.maxTreasures) this.globalGameConfig.maxTreasures = newConfig.maxTreasures;
    if (newConfig.pointsPerTreasure) this.globalGameConfig.pointsPerTreasure = newConfig.pointsPerTreasure;
    if (newConfig.winCondition) this.globalGameConfig.winCondition = newConfig.winCondition;
  }

  recordGameResult({ winner, treasuresFound = 0 }) {
    this.globalAnalytics.totalGamesPlayed++;
    // winner is usually teamIndex (0 for Alpha, 1 for Beta)
    if (winner === 0) this.globalAnalytics.teamAWins++;
    if (winner === 1) this.globalAnalytics.teamBWins++;
    
    this.globalAnalytics.treasuresFound += treasuresFound;
  }
}

// Export as a singleton
module.exports = new PlatformState();
