function load(week){
	var chartMon = myChart(week, "Mon");
	var chartTue = myChart(week, "Tue");
	var chartWed = myChart(week, "Wed");
	var chartThu = myChart(week, "Thu");
	var chartFri = myChart(week, "Fri");
	var chartSat = myChart(week, "Sat");
	var chartSun = myChart(week, "Sun");
}

function myChart(week, day){
	var chart = new Chart(document.getElementById(day).getContext('2d'), {
		type: 'bar',
		data: {
			labels: ["00:00-03:00", "03:00-06:00", "06:00-09:00", "09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-00:00"],
			datasets: [{
				label: 'favorites',
				data: [week[day]["0"]["fv"], week[day]["3"]["fv"], week[day]["6"]["fv"], week[day]["9"]["fv"], week[day]["12"]["fv"], week[day]["15"]["fv"], week[day]["18"]["fv"], week[day]["21"]["fv"]],
				backgroundColor: 'rgba(255, 0, 0, 0.5)',
				borderColor: 'rgba(255, 0, 0, 1)',
				borderWidth: 1
			},
			{
				label: 'retweets',
				data: [week[day]["0"]["rt"], week[day]["3"]["rt"], week[day]["6"]["rt"], week[day]["9"]["rt"], week[day]["12"]["rt"], week[day]["15"]["rt"], week[day]["18"]["rt"], week[day]["21"]["rt"]],
				backgroundColor: 'rgba(0, 255, 0, 0.5)',
				borderColor: 'rgba(0, 255, 0, 1)',
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});
	return chart;
}
