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

const popupOpen = () => {
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

const popupClose = () => {
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

// $wakusei.addEventListener( 'click', tachieAnim );
// $wakusei.addEventListener( 'click', nameRomajiAnim );
// $wakusei.addEventListener( 'click', nameKanjiAnim );
// $wakusei.addEventListener( 'click', radiusAnim );
// $wakusei.addEventListener( 'click', revolutionAnim );
// $wakusei.addEventListener( 'click', rotationAnim );
// $wakusei.addEventListener( 'click', moonAnim );
// $wakusei.addEventListener( 'click', descriptionAnim );
// $wakusei.addEventListener( 'click', titleAnim );
$wakusei.addEventListener( 'click', () => {
  $wakusei.classList.toggle( "activated" )
} );
$wakusei.addEventListener( 'click', () => {
  if ( $wakusei.classList.contains( "activated" ) ) {
    popupClose();
  } else {
    popupOpen()
  }
} );

// $wakusei.addEventListener( "click", function () {
//   alert( "asdf" );
// } )