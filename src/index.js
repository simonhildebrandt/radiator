import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes, css } from 'styled-components'
import { DateTime } from 'luxon';
import axios from 'axios';


const lightToDark = keyframes`
  from {
    color: black;
    background-color: white;
  }
  to {
    color: white;
    background-color: black;
  }
`

const darkToLight = keyframes`
  from {
    color: white;
    background-color: black;
  }
  to {
    color: black;
    background-color: white;
  }
`

const Flex = styled.div`
  display: flex;
  flex-direction: ${props => props.column ? 'column' : 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: center;
`

const DateBlock = styled(Flex)`
  font-family: 'Castoro', serif;
`

const Time = styled(DateBlock)`
  font-size: 20vw;
`


const Date = styled(DateBlock)`
  font-size: 7vw;
`

const Grey = styled.div`
  color: grey;
  font-size: 5vw;
  font-family: 'Roboto', sans-serif;
  margin-right: 4vw;
  margin-left: 4vw;
`

const colourModeMixin = props => css`
  ${props.light ? darkToLight : lightToDark} 5s linear forwards;
`

const Content = styled(Flex)`
  height: 100%;
  animation: ${colourModeMixin};
  justify-content: flex-start;
`

const weatherAPI = "http://api.openweathermap.org/data/2.5/forecast?q=Melbourne,au&APPID=TOKEN";

axios.get(weatherAPI)
  .then(response => console.log(response.data))

const App = () => {
  const [currentTime, setCurrentTime] = useState(DateTime.local());
  useEffect(() => {
    setInterval(() => setCurrentTime(DateTime.local()), 1000)
  }, []);

  const time = currentTime.toFormat("h:mm");
  const seconds = currentTime.toFormat("ss");
  const ampm = currentTime.toFormat("a").toLowerCase();
  const day = currentTime.toFormat("cccc");
  const date = currentTime.toLocaleString(DateTime.DATE_SHORT);

  const lightTime = currentTime.hour > 6 && currentTime.hour < 18;

  return <Content column light={lightTime}>
    <Flex justify="center" row>
      <Time>{time}</Time>
      <Flex column justify="space-evenly">
        <Grey>
          <Flex>{seconds}</Flex>
          <Flex>{ampm}</Flex>
        </Grey>
      </Flex>
      <Date column>
        <Flex>{day}</Flex>
        <Flex>{date}</Flex>
      </Date>
    </Flex>
  </Content>;
}

ReactDOM.render(<App/>, document.getElementById('app'));
