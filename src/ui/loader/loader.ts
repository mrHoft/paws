import styled, { css, keyframes } from 'styled-components'
import React from 'react'
import paw from './icons/paw.svg'

const Paws: React.FC = () => {
  return (
    <>
    <Paw1/>
    < Paw2 />
    <Paw3/>
    < Paw4 />
    <Paw5/>
    < Paw6 />
    <Paw7/>
    < Paw8 />
    </>
  )
}

const walk = keyframes`
  15% {
    opacity: 0.6;
  }
  75% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
`

const basePaw = css`
  opacity: 0;
  position: absolute;
  mask-image: url(${paw});
  height: 2em;
  width: 2em;
`

const Paw1 = styled.div`
  ${basePaw};
  left: 75px;
  top: 250px;
  animation: ${walk} 5s linear infinite;
`

const Paw2 = styled.div`
  ${basePaw};
  left: 275px;
  top: 360px;
  transform: rotate(-5deg);
  animation: ${walk} 5s linear infinite 0.25s;
`

const Paw3 = styled.div`
  ${basePaw};
  left: 375px;
  top: 150px;
  transform: rotate(-10deg);
  animation: ${walk} 5s linear infinite 0.5s;
`

const Paw4 = styled.div`
  ${basePaw};
  left: 575px;
  top: 280px;
  transform: rotate(-20deg);
  animation: ${walk} 5s linear infinite 0.75s;
`

const Paw5 = styled.div`
  ${basePaw};
  left: 650px;
  top: 50px;
  transform: rotate(10deg);
  animation: ${walk} 5s linear infinite 1s;
`

const Paw6 = styled.div`
  ${basePaw};
  left: 875px;
  top: 200px;
  transform: rotate(10deg);
  animation: ${walk} 5s linear infinite 1.25s;
`

const Paw7 = styled.div`
  ${basePaw};
  left: 1075px;
  top: 50px;
  transform: rotate(20deg);
  animation: ${walk} 5s linear infinite 1.5s;
`

const Paw8 = styled.div`
  ${basePaw};
  left: 1150px;
  top: 250px;
  transform: rotate(10deg);
  animation: ${walk} 5s linear infinite 1.75s;
`

export default Paws
