import { IconMatcher } from '../../types/icon-types.js'

export const undertaleIcons: IconMatcher[] = [
  {
    pattern: [
      'Progressive Plot',
      /Undyne's Letter.*/,
      'Complete Skeleton',
      'DT Extractor',
      'Mettaton Plush',
      /.*Home Key/,
      'Key Piece',
      'Ruins Key',
      'Snowdin Key',
      'Waterfall Key',
      'Hotland Key',
      'Core Key',
    ],
    emoji: 'undertale_save'
  },
  {
    pattern: [
      'Progressive Weapons',
      'Stick',
      /.*Knife/,
      'Tough Glove',
      'Ballet Shoes',
      'Torn Notebook',
      'Burnt Pan',
      'Empty Gun',
      'Worn Dagger',
    ],
    emoji: 'undertale_knife'
  },
  {
    pattern: [
      'Progressive Armor',
      'Bandage',
      'Faded Ribbon',
      'Manly Bandanna',
      'Old Tutu',
      'Cloudy Glasses',
      'Stained Apron',
      'Cowboy Hat',
      /.*Locket/,
      'temy armor',
    ],
    emoji: 'undertale_apron'
  },
  {
    pattern: [
      /.*Candy/,
      'Croquet Roll',
      'Pumpkin Rings',
      /Spider.*/,
      'Stoic Onion',
      'Ghost Fruit',
      /.*Pie/,
      'Snowman Piece',
      'Nice Cream',
      'Puppydough Icecream',
      'Bisicle',
      'Unisicle',
      'Cinnamon Bun',
      'Temmie Flakes',
      'Abandoned Quiche',
      'Dog Salad',
      'Astronaut Food',
      'Instant Noodles',
      'Crab Apple',
      'Hot Dog...?',
      'Hot Cat',
      'Glamburger',
      'Sea Tea',
      'Starfait',
      'Legendary Hero',
      'Bad Memory',
      'Dream',
      'Popato Chisps',
      'Junk Food',
      'Face Steak',
      'Hush Puppy',
    ],
    emoji: 'undertale_spaghetti'
  },
  {
    pattern: [
      'Punch Card',
      'Dog Residue',
      'Mystery Key',
      '100G',
      '500G',
      '1000G',
    ],
    emoji: 'undertale_box'
  },
  { pattern: ['Annoying Dog'], emoji: 'undertale_hotdog' },
  {
    pattern: [
      'LOVE',
      'ATK Up',
      'DEF Up',
      'HP Up',
    ],
    emoji: 'undertale_yellow'
  },
  { pattern: ['FIGHT'], emoji: 'undertale_fight' },
  { pattern: ['ACT'], emoji: 'undertale_'act },
  { pattern: ['ITEM'], emoji: 'undertale_item' },
  { pattern: ['MERCY'], emoji: 'undertale_mercy' },
]
