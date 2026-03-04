import { GameScene, type GameEventCallback } from "./GameScene";
import { GhostPlayer } from "../entities/GhostPlayer";
import { getSkinById } from "@fangdash/shared/skins";

export interface RaceOpponent {
  id: string;
  username: string;
  skinId: string;
}

export interface RaceCallbacks extends GameEventCallback {
  onPositionUpdate?: (distance: number, score: number) => void;
  onPlayerDied?: () => void;
}

export interface RaceInitData {
  callbacks?: RaceCallbacks;
  skinKey?: string;
  seed: string;
  opponents: RaceOpponent[];
}

export class RaceScene extends GameScene {
  private ghosts: Map<string, GhostPlayer> = new Map();
  private raceCallbacks: RaceCallbacks = {};
  private localDistance = 0;
  private lastPositionUpdate = 0;
  private raceSeed = "";
  private raceStarted = false;
  private pendingOpponents: RaceOpponent[] = [];

  constructor() {
    super("RaceScene");
  }

  init(data: RaceInitData) {
    // Forward base callbacks to parent
    super.init({ callbacks: data.callbacks, skinKey: data.skinKey, seed: data.seed });

    this.raceCallbacks = data.callbacks ?? {};
    this.raceSeed = data.seed ?? "";
    this.raceStarted = false;
    this.lastPositionUpdate = 0;
    this.localDistance = 0;

    // Clean up any existing ghosts from a previous run
    for (const ghost of this.ghosts.values()) {
      ghost.destroy();
    }
    this.ghosts.clear();

    // Store opponents to create after create() sets up the scene
    this.pendingOpponents = data.opponents ?? [];
  }

  create() {
    super.create();

    // Create ghost players for each opponent
    for (const opp of this.pendingOpponents) {
      const skin = getSkinById(opp.skinId);
      const spriteKey = skin?.spriteKey ?? "wolf-gray";
      const ghost = new GhostPlayer(this, opp.username, spriteKey);
      this.ghosts.set(opp.id, ghost);
    }
    this.pendingOpponents = [];
  }

  /** Called by React layer after countdown completes */
  beginRace() {
    this.raceStarted = true;
    this.startRun();
  }

  update(time: number, delta: number) {
    if (!this.raceStarted) return;

    super.update(time, delta);

    // Track local distance from score manager
    this.localDistance = this.scoreManager.distance;

    // Send position updates at ~100ms intervals
    if (this.running && this.player.alive) {
      this.lastPositionUpdate += delta;
      if (this.lastPositionUpdate >= 100) {
        this.lastPositionUpdate = 0;
        this.raceCallbacks.onPositionUpdate?.(
          Math.floor(this.scoreManager.distance),
          Math.floor(this.scoreManager.score)
        );
      }
    }
  }

  /** Called by the React layer when an opponent sends a position update. */
  receiveOpponentUpdate(id: string, distance: number, _score: number) {
    const ghost = this.ghosts.get(id);
    if (!ghost) return;

    const offset = distance - this.localDistance;
    ghost.updatePosition(offset);
  }

  /** Called by the React layer when an opponent dies. */
  receiveOpponentDied(id: string) {
    const ghost = this.ghosts.get(id);
    if (!ghost) return;

    ghost.showDeath();
  }

  protected override gameOver() {
    super.gameOver();
    this.raceCallbacks.onPlayerDied?.();
  }
}
