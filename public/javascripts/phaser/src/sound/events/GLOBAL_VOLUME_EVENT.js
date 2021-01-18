/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * The Sound Manager Global Volume Event.
 * 
 * This event is dispatched by the Sound Manager when its `volume` property is changed, either directly
 * or via the `setVolume` method. This changes the volume of all active sounds.
 * 
 * Listen to it from a Scene using: `this.sound.on('volume', listener)`.
 *
 * @event Phaser.Sound.Events#GLOBAL_VOLUME
 * @since 3.0.0
 * 
 * @param {(Phaser.Sound.WebAudioSoundManager|Phaser.Sound.HTML5AudioSoundManager)} soundManager - A reference to the sound manager that emitted the event.
 * @param {number} volume - The new global volume of the Sound Manager.
 */
module.exports = 'volume';
