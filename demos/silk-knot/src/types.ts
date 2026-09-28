export interface Point {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
}

export interface Ripple {
  arcPos: number;
  birth: number;
  strength: number;
  speed: number;
}

export interface PointerState {
  x: number;
  y: number;
  down: boolean;
  drawing: boolean;
}
