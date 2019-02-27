/**
 * Created by DEDZTBH on 2/27/19.
 */

export const SoundFX = {
    SUCCEED: 'Ping',
    NOT_GOOD: 'Sosumi',
    FAILED: 'Buzz',
    WARN: 'Glass',
    INFO: 'Morse'
}
let aud

export function play(name) {
    if (aud) aud.pause()
    aud = new Audio('static/sound/' + name + '.mp3')
    aud.play()
}
