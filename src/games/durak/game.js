import { Game } from "boardgame.io/core";

/**
 * Game Logic
 * 
 * ## Game End
 * Game ends when drawstack is empty and all players except one 
 * are out of hand cards.
 * 
 * 
 * ## Game Start
 * In the first game of a session the starting player is selected randomly.
 * After the first game, the loser becomes the 'dealer' (is marked in state)
 * and the player next to the dealer is starting the next game.
 * 
 * ## Attack
 * The player whose turn it is attacks 
 * the next player in line by laying one or more cards having 
 * the same value onto the battlefield.
 * The battlefield can hold as many cards as there were dealt
 * in the beginning of the game. (typically 5 or 6)
 * The attackers can play only cards of values that are already 
 * on the battlefield.
 * When more than two players join the game, the player next 
 * to the one attacked can also attack with his cards.
 * 
 * ## Defend
 * The defender needs to beat all cards on the battlefield 
 * using either a higher card of the same suit or any trump.
 * (in case the attacking card is a trumpcard, the defender has to beat
 * it with a higher trumpcard)
 * If the defender has a card of the same value as the attacking cards,
 * he can add his card and move the attack to the next player in line.
 * The upper rule only applies, if the defender has not 
 * beaten any attacking card in the current attack.
 * Furthermore the attack can only be deflected if the next player in line
 * holds more than there are cards deflected (+n for the deflecting cards)
 * If the attack gets deflected, the previous attacker 
 * has to fill up his hand cards again.
 *
 * If the defender beats all cards on the battlefield, the attackers
 * refill their hand cards followed by the defender.
 * If the defender is not able to beat all cards on the battlefield
 * he has to surrender and takes all cards from the battlefield onto his hand.
 * In this case, the defender is skipped and cannot attack for this round,
 * the player next in line is the new attacker (currentPlayer [next()->next()])
 * 
 * When the defender either beats all cards or surrenders, all attackers (max. 2)
 * need to acknowledge the end of the turn.
 * 
 * When a turn ends, all cards get refillled up to initial card count.
 * 
 * If the draw stack is empty the cards per player do not get refilled.
 * 
 * NOTE:
 *  Action 'add more cards' can be represented through 'attack', as adding cards is basically
 *  another attack
 */

// import cards (React Components)
const createDeck = () => {
  let deck = []

  let suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs']
  let values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push({
        value: value,
        suit: suit
      })
    })
  })

  return deck
}

/*
example for a slot in the current round
{
      playerId: 0,
      attack: {},
      defend: {}
    }
*/
const roundTemplate = {
  slots: [
    {
      playerId: 0,
      attack: { value: '2'},
      defend: { value: 'K'}
    }
  ],
  defender: {},
  attackers: [{

  }],
  acknowledged: [],
  done: false
}

const playerTemplate = (id) => ({
  id: id,
  hand: [],
  beaten: []
})

const deal_cards = (deck, count) => {
  let dealt = []
  for(let i = 0; i < count; ++i) {

    dealt.push(deck.shift())
  }

  return dealt
} 

const Durak = Game({
  name: 'durak',
  setup: (ctx) => {
    // create card deck
    let deck = createDeck()
    deck = ctx.random.Shuffle(deck)
    
    let players = Array(ctx.numPlayers)

    // hand cards to players
    for (let i = 0; i < ctx.numPlayers; ++i) {
      players[i] = playerTemplate(i)
    }

    // hand first three cards
    players.forEach((player) => {
      player.hand = player.hand.concat(deal_cards(deck, 3))
    })
    
    // pick trump
    let trump = deal_cards(deck, 1)[0]

    // deaf last cards
    players.forEach((player) => {
      player.hand = player.hand.concat(deal_cards(deck, 3))
    })

    const state = {
      deck: deck,
      players: players,
      trump: trump,
      currentRound: roundTemplate
    }

    return state
  },

  moves: {
    // player lays card, can either be attack or defense in durak
    // could also be used for adding cards to battlefield
    attack(G, ctx, card, playerId) {
      if (G.currentRound.slots.length == 6) {
        // cannot attack player anymore
        // todo: replace slot count by configurable var
        return false
      }

      //check if player is attacker
      if(G.currentRound.attackers.filter(item => item.id !== playerId)) {
        return false
      }

      // check whether the value of the card can be played
      let playedValues = G.currentRound.slots.map(item => ([item.attack.value, item.defend.value]))

      console.log(playedValues)


      return G
    },
    defend(G, ctx, slot, card) {
      return G
    },
    deflect(G, ctx, card) {
      // battlefield cards can be read from the gamestate
    },
    // should only be callable, when each slot is beaten
    acknowledge(G, ctx, playerId) {
      G.currentRound.acknowledged.push(playerId)

      if (G.currentRound.acknowledged.length == G.currentRound.attackers.length) {
        ctx.events.endTurn()
      }

      return G
    },
    surrender(G, ctx) {
      let defenderId = G.currentRound.defender.id
      let defender = G.players.filter((player) => player.id === defenderId)

      G.currentRound.slots.forEach((slot) => {
        defender.hand.push(slot.attack)
        if(slot.defend) defender.hand.push(slot.defend)
      })

      ctx.events.endTurn()

      return G
    }
  },

  flow: {
    endTurn: true,
    onTurnEnd: (G, ctx) => {
      G.currentRound = roundTemplate
    },
    endGameIf: (G, ctx) => {
      if (IsVictory(G.cells)) {
        return { winner: ctx.currentPlayer };
      }
      if (IsDraw(G.cells)) {
        return { draw: true };
      }
    },
    phases: {
      attacking: {
        allowedMoves: ['attack'],
        endPhaseIf: (G) => {
          return false
        },
        next: 'defending',
      },
      defending: {
        allowedMoves: ['attack', 'defend', 'deflect', 'surrender'],
        endPhaseIf: (G) => {
          return false
        },
      }
    }
  },
})

export default Durak;
