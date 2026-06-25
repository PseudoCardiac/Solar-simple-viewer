import { animate, spring, utils, easings } from 'animejs';


const [ $wakusei ] = utils.$( "#wakusei" );

const [ $tachie ] = utils.$('#tachie');
const [ $nameRomaji ] = utils.$('#name-romaji');
const [ $nameKanji ] = utils.$('#name-kanji');
const [ $title ] = utils.$('#title');
const [ $description ] = utils.$('#description');
const [ $radius ] = utils.$('#radius');
const [ $revolution ] = utils.$('#revolution');
const [ $rotation ] = utils.$('#rotation');
const [ $moon ] = utils.$('#moon');


const tachieAnim = () => {
  animate( $tachie, {
    translateY: { from: "2000px", to: "0px" },
    ease: spring( { stiffness: 100 } )
  } )
}
const nameRomajiAnim = () => {
  animate( $nameRomaji, {
    delay: 100,
    translateX: { from: "-50vw", to: $nameRomaji.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const nameKanjiAnim = () => {
  animate( $nameKanji, {
    translateX: { from: "-50vw", to: $nameKanji.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const radiusAnim = () => {
  animate( $radius, {
    translateX: { from: "30vw", to: $radius.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const revolutionAnim = () => {
  animate( $revolution, {
    delay: 100,
    translateX: { from: "30vw", to: $revolution.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const rotationAnim = () => {
  animate( $rotation, {
    delay: 200,
    translateX: { from: "30vw", to: $rotation.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const moonAnim = () => {
  animate( $moon, {
    delay: 300,
    translateX: { from: "30vw", to: $moon.style.left },
    ease: "out(3)",
    duration: 500
  } )
}
const descriptionAnim = () => {
  animate( $description, {
    delay: 1500,
    opacity: { from: 0, to: 1 },
    duration: 500
  } )
}
const titleAnim = () => {
  animate( $title, {
    delay: 1000,
    opacity: { from: 0, to: 1 },
    duration: 500
  } )
}

const tachieAnimRev = () => {
  animate( $tachie, {
    translateY: { to: "2000px", from: "0px" },
    ease: spring( { stiffness: 100 } )
  } )
}
const nameRomajiAnimRev = () => {
  animate( $nameRomaji, {
    delay: 100,
    translateX: { to: "-50vw", from: $nameRomaji.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const nameKanjiAnimRev = () => {
  animate( $nameKanji, {
    translateX: { to: "-50vw", from: $nameKanji.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const radiusAnimRev = () => {
  animate( $radius, {
    translateX: { to: "30vw", from: $radius.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const revolutionAnimRev = () => {
  animate( $revolution, {
    delay: 100,
    translateX: { to: "30vw", from: $revolution.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const rotationAnimRev = () => {
  animate( $rotation, {
    delay: 200,
    translateX: { to: "30vw", from: $rotation.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const moonAnimRev = () => {
  animate( $moon, {
    delay: 300,
    translateX: { to: "30vw", from: $moon.style.left },
    ease: "in(3)",
    duration: 500
  } )
}
const descriptionAnimRev = () => {
  animate( $description, {
    opacity: { to: 0, from: 1 },
    duration: 500
  } )
}
const titleAnimRev = () => {
  animate( $title, {
    opacity: { to: 0, from: 1 },
    duration: 500
  } )
}

const popupOpen = ( data ) => {
  setDecor( data );
  tachieAnim();
  nameRomajiAnim();
  nameKanjiAnim();
  radiusAnim();
  revolutionAnim();
  rotationAnim();
  moonAnim();
  descriptionAnim();
  titleAnim();
}

const popupClose = ( data ) => {
  setDecor( data );
  tachieAnimRev();
  nameRomajiAnimRev();
  nameKanjiAnimRev();
  radiusAnimRev();
  revolutionAnimRev();
  rotationAnimRev();
  moonAnimRev();
  descriptionAnimRev();
  titleAnimRev();
}

// $wakusei.addEventListener( 'click', () => {
//   $wakusei.classList.toggle( "activated" )
// } );
// $wakusei.addEventListener( 'click', () => {
//   if ( $wakusei.classList.contains( "activated" ) ) {
//     popupClose();
//   } else {
//     popupOpen();
//   }
// } );

// $wakusei.addEventListener( "click", function () {
//   alert( "asdf" );
// } )

const DECOR = document.getElementById( "decor" );
const ART = document.getElementById( "tachie" );
const NAME_ROMAJI = document.getElementById( "name-romaji" );
const NAME_KANJI = document.getElementById( "name-kanji" );
const TITLE = document.getElementById( "title" );
const DESC = document.getElementById( "description" );
const RADIUS = document.getElementById( "radius-text" );
const REVOLUTION = document.getElementById( "revolution-text" );
const ROTATION = document.getElementById( "rotation-text" );
const MOON = document.getElementById( "moon-text" );

const setDecor = ( data ) => {
  ART.src = data.artwork;
  ART.style.top = `${ -(data.top) }px`;
  ART.style.left = `calc( 30vw - ${ data.left }px )`
  // ART.style.maskImage = `linear-gradient(to right, rgba(0, 0, 0, 1.0) ${ ART.style.left }, rgba(0, 0, 0, 1.0) calc( ${ ART.style.left } + 20vw ), transparent calc( ${ ART.style.left } + 50vw ));`
  NAME_ROMAJI.textContent = data.en;
  NAME_KANJI.textContent = data.name
  TITLE.textContent = data.subtitle;
  DESC.textContent = data.desc;
  RADIUS.textContent = data.facts[ "直径" ];
  REVOLUTION.textContent = data.facts[ "公転周期" ];
  ROTATION.textContent = data.facts[ "自転周期" ];
  MOON.textContent = data.facts[ "衛星" ];
}

export { popupOpen, popupClose };