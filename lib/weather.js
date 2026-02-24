trend: {
  morning: {
    temp: today.hour[9].temp_c,
    code: today.hour[9].condition.code
  },
  afternoon: {
    temp: today.hour[15].temp_c,
    code: today.hour[15].condition.code
  },
  evening: {
    temp: today.hour[21].temp_c,
    code: today.hour[21].condition.code
  }
}
