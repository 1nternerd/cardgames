import React from 'react';
import { render } from 'react-dom';
import { Client } from 'boardgame.io/react';
import {Game, Board} from './games/durak';
import './styles.css';

const GameClient = Client({
  game: Game,
  board: Board,
  numPlayers: 2,
});

/*const App = () => (
  <div>
    <GameClient playerId="1"/>
    <GameClient playerId="2"/>
  </div>
)*/

//render(<App />, document.getElementById('root'));
render(<GameClient />, document.getElementById('root'));
