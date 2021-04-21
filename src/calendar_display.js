import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components'

import axios from 'axios';
import { DateTime, Interval } from 'luxon';

import { Flex } from './styled';

// import data from './date-data';


const Day = styled(Flex)`
  margin: 0 2vw 4vw 2vw;
  font-family: 'Castoro', serif;
`

const DayLabel = styled(Flex)`
font-size: 6vw;
flex-grow: 1;
margin-bottom: 1vw;
`

const DayTitle = styled(Flex)`
  font-weight: bold;
`

const Events = styled(Flex)`
  font-size: 4vw;
  flex-wrap: wrap;
  gap: 5vw;
`

const Event = styled(Flex)`
  min-width: 25vw;
`

function buildCalendarData(items) {
  //console.log(JSON.stringify(items))
  const today = DateTime.local().startOf('day');
  let current = DateTime.local().startOf('day');

  const days = [];

  while (true) {
    let label = current.weekdayLong;
    if (current.equals(today)) label = "Today";
    if (current.equals(today.plus({ days: 1 }))) label = "Tomorrow";

    const events = [];

    const dayInterval = new Interval({
      start: current,
      end: current.endOf("day")
    });

    items.forEach(event => {
      if (event.start.date) { // daylong / range

        const start = DateTime.fromISO(event.start.date).startOf("day");
        const end = DateTime.fromISO(event.end.date).minus({ days: 1 }).endOf("day");
        const interval = new Interval({ start, end });

        if (interval.contains(current)) {
          events.push({ summary: event.summary });
        }
      } else { // timed
        const eventStart = DateTime.fromISO(event.start.dateTime);

        if (dayInterval.contains(eventStart)) {
          events.push({
            summary: event.summary,
            time: eventStart.toFormat("h:mma").toLowerCase()
          });
        }
      }
    });

    days.push({
      day: { label: label },
      events
    });

    if (current > today.plus({ days: 5 })) break;

    current = current.plus({ days: 1 });
  }

  return days;
}

const calendarUrl = "https://us-central1-radiator-c38a6.cloudfunctions.net/calendar";

export default function ({ calendarUser }) {
  const [calendarData, setCalendarData] = useState(null);

  const call = useCallback(() => {
    axios.get(calendarUrl + `?userId=${calendarUser}`, { crossDomain: true })
      .then(resp => setCalendarData(buildCalendarData(resp.data.data.items)));
  });

  useEffect(() => {
    const cancel = setInterval(() => {
      call();
    }, 60 * 60 * 1000);

    call();

    return () => clearInterval(cancel);
  }, []);

  if (!calendarData) return null;

  return <Flex column align="flex-start">
    {calendarData.map(({ day, events }, index) => (
      <div key={index}>
        { events.length > 0 &&
          <Day column align="flex-start">
            <DayLabel>
              <DayTitle>{day.label}</DayTitle>
            </DayLabel>
            <Events>
              {events.map(({ summary, time }, index) => (
                <Event key={index}>
                  {summary} { time && `(${time})`}
                </Event>
              ))}
            </Events>
          </Day>
        }
      </div>
    ))}
  </Flex>;
}
