import Phaser from 'phaser';

/**
 * Thin bridge between React (menus/overlays) and Phaser (the world). React
 * emits UI intents (e.g. "wear this outfit"); scenes emit world events (e.g.
 * "character tapped") that overlays react to. Neither side reaches into the
 * other's internals.
 */
export const EventBus = new Phaser.Events.EventEmitter();
