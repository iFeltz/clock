function Clock() {
  const TIME_UPDATE_INTERVAL = 1000
  const TIME_SYNC_INTERVAL = 60000
  const self = this

  let SEC_INTERVAL, SYNC_INTERVAL
  let clock_element, date_element, analog_element, analog_hours,
    arrow_sec, arrow_min, arrow_hrs;

  let time_url = 'http://worldtimeapi.org/api/ip'
  let date = null
  let time = null
  let is12HoursType = true

  const init = () => {
    analogClockInit();

    clock_element = document.getElementById("clock__value");
    date_element = document.getElementById("clock__date");

    timeRequest({ url: time_url }, (err, res) => {
      if (err) throw err;

      date = new Date(JSON.parse(res).unixtime * 1000);

      updateTime();
      clock_element.innerHTML = time;
      date_element.innerHTML = dateString;

      document.getElementById("clock").style.display = "flex"
      setIntervals();
    })

    eventHandlers();
  }

  const updateTime = () => {
    if (!date) return;

    date.setSeconds(date.getSeconds() + 1)

    let hours = leadingZero(date.getHours());
    let minutes = leadingZero(date.getMinutes());
    let seconds = leadingZero(date.getSeconds());

    /*
     * поворот часовых стрелок
     */
    let angle_sec = -90 + 6 * Number(seconds);
    let angle_min = -90 + 6 * Number(minutes);
    let angle_hrs = -90 + 30 * (Number(hours) % 12) + Number(minutes) / 2;

    arrow_sec.style.transform = `rotate(${angle_sec}deg)`;
    arrow_min.style.transform = `rotate(${angle_min}deg)`;
    arrow_hrs.style.transform = `rotate(${angle_hrs}deg)`;

    /************************/

    if (is12HoursType) {
      let postfix = hours > 12 ? 'p.m.' : 'a.m.';
      seconds += ` ${postfix}`;
      hours = leadingZero(hours % 12);
    }

    time = `${hours}:${minutes}:${seconds}`;
    dateString = date.toLocaleString('ru', { day: '2-digit', month: 'long', year: 'numeric' }).split('');
    // вырезаем последние 3 символа ' г.'
    dateString.splice(-3, 3);
    dateString = dateString.join('');
  }

  const setIntervals = () => {
    // интервал обновления времени
    SEC_INTERVAL = setInterval(() => {
      updateTime();
      clock_element.innerHTML = time;
      date_element.innerHTML = dateString;
    }, TIME_UPDATE_INTERVAL);

    // интервал синхронизирующий время
    SYNC_INTERVAL = setInterval(() => {
      timeRequest({ url: time_url });
    }, TIME_SYNC_INTERVAL);
  }

  const stopIntervals = () => {
    clearInterval(SEC_INTERVAL);
    clearInterval(SYNC_INTERVAL);
  }

  // ведущий ноль в обозначениях времени
  const leadingZero = val => {
    return (val < 10 ? '0':'') + val;
  }

  // обработка всех событий
  const eventHandlers = () => {
    // переключение между 12 и 24- часовыми форматами
    const changer = document.getElementById("clock__changer");
    const timeType = document.getElementById("clock__changer-value");

    changer.addEventListener('click', () => {
      is12HoursType = !is12HoursType;
      timeType.innerHTML = is12HoursType ? '24h' : '12h';
    })

    const timezones = document.getElementById("clock__timezones");

    timezones.addEventListener('change', function() {
      time_url = this.value;
      stopIntervals();

      timeRequest({ url: time_url }, (err, res) => {
        if (err) throw err;

        let newTime = new Date().toLocaleString("en-US", {timeZone: JSON.parse(res).timezone});
        date = new Date(newTime);

        setIntervals();
      })
    })
  }

  const timeRequest = (options, done) => {
    const xhr = new XMLHttpRequest();

    xhr.open(options.method || 'GET', options.url);
    if (typeof done === 'function') {
      xhr.onload = () => done(null, xhr.response);
      xhr.onerror = () => done(xhr.response);
    }
    xhr.send();
  }

  const analogClockInit = () => {
    analog_element = document.getElementById("clock-analog");
    arrow_sec = document.getElementById("arrow__sec");
    arrow_min = document.getElementById("arrow__min");
    arrow_hrs = document.getElementById("arrow__hrs");
    analog_hours = document.getElementsByClassName('clock-analog__hour');

    let width = analog_element.offsetWidth || 200;
    let height = analog_element.offsetHeight || 200;

    // позиционирование чисел по кругу
    for (let i = 0; i < analog_hours.length; i++) {
      let offsetOrigin = (height - 20 - 7) / 2; // 20 - суммарный отступ чисел сверху и снизу, 7 - половина ширины тега с числом
      let angle = i * 30;

      analog_hours[i].style.transformOrigin = `7px ${offsetOrigin}px`
      analog_hours[i].style.transform = `translateX(-50%) rotate(${angle}deg)`;
      // возвращает сами значения чисел в прямое состояние
      analog_hours[i].children[0].style.transform = `translateX(-50%) rotate(${-angle}deg)`;
    }

  }

  return {
    init
  }
}

window.onload = new Clock().init();