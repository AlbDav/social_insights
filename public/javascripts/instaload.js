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
				label: 'likes',
				data: [week[day]["0"]["likes"], week[day]["3"]["likes"], week[day]["6"]["likes"], week[day]["9"]["likes"], week[day]["12"]["likes"], week[day]["15"]["likes"], week[day]["18"]["likes"], week[day]["21"]["likes"]],
				backgroundColor: 'rgba(255, 0, 0, 0.5)',
				borderColor: 'rgba(255, 0, 0, 1)',
				borderWidth: 1
			},
			{
				label: 'comments',
				data: [week[day]["0"]["comments"], week[day]["3"]["comments"], week[day]["6"]["comments"], week[day]["9"]["comments"], week[day]["12"]["comments"], week[day]["15"]["comments"], week[day]["18"]["comments"], week[day]["21"]["comments"]],
				backgroundColor: 'rgba(0, 0, 255, 0.5)',
				borderColor: 'rgba(0, 0, 255, 1)',
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
