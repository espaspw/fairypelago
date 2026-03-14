import { IconMatcher } from '../../types/icon-types.js'

export const paintIcons: IconMatcher[] = [
  { pattern: [/Progressive Canvas.*/], emoji: 'frame_photo' },
  { pattern: ['Progressive Color Depth (Red)'], emoji: 'red_square' },
  { pattern: ['Progressive Color Depth (Green)'], emoji: 'green_square' },
  { pattern: ['Progressive Color Depth (Blue)'], emoji: 'blue_square' },
  { pattern: ['Free-Form Select'], emoji: 'twisted_rightwards_arrows' },
  { pattern: ['Select'], emoji: 'arrow_upper_left' },
  { pattern: ['Eraser/Color Eraser'], emoji: 'sponge' },
  { pattern: ['Fill With Color'], emoji: 'bucket' },
  { pattern: ['Pick Color'], emoji: 'syringe' },
  { pattern: ['Magnifier'], emoji: 'mag' },
  { pattern: ['Pencil'], emoji: 'pencil2' },
  {
    pattern: [
      'Brush',
      'Airbrush',
    ],
    emoji: 'paintbrush'
  },
  { pattern: ['Text'], emoji: 'pencil' },
  { pattern: ['Line'], emoji: 'straight_ruler' },
  { pattern: ['Curve'], emoji: 'loop' },
  { pattern: ['Rectangle'], emoji: 'stop_button' },
  { pattern: ['Polygon'], emoji: 'octagon_sign' },
  { pattern: ['Ellipse'], emoji: 'arrows_clockwise' },
  { pattern: ['Rounded Rectangle'], emoji: 'white_square_button' },
  { pattern: ['Additional Palette Color'], emoji: 'paint_crayon' },
  { pattern: [/.*Trap/], emoji: 'wastebasket' },
]
