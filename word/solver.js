// Information Theory (Entropy / Option Elimination) Engine
class WordleSolver {
  static getPattern(guess, answer) {
    const pattern = [0, 0, 0, 0, 0];
    // 2-Pass evaluation for greens and yellows...
    return pattern.join('');
  }

  static filterRemaining(possibleSecrets, guessHistory) {
    return possibleSecrets.filter(secret => {
      for (let item of guessHistory) {
        if (this.getPattern(item.word, secret) !== item.pattern) return false;
      }
      return true;
    });
  }

  static getTopRecommendations(possibleSecrets, allowBurners = false, topN = 5) {
    // Calculates expected average remaining words across candidates
  }
}
