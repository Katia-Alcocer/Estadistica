 let data = [4, 6, 8, 10, 12];
  const colors = ['#C0392B','#2980B9','#27AE60','#8E44AD','#E67E22'];

  function mean(arr) {
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  function stdDev(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/arr.length);
  }

  function points(arr) {
    return {
      type:'scatter',
      data: arr.map((y,i)=>({x:i+1,y})),
      backgroundColor: colors,
      borderColor: colors,
      pointRadius: 8
    };
  }

  function meanLine(arr) {
    const m = mean(arr);
    return {
      type:'line',
      data: arr.map((_,i)=>({x:i+1,y:m})),
      borderDash:[6,6],
      borderColor:'#003A8F',
      pointRadius:0
    };
  }

  function deviationLines(arr) {
    const m = mean(arr);
    return arr.map((y,i)=>({
      type:'line',
      data:[{x:i+1,y},{x:i+1,y:m}],
      borderDash:[4,4],
      borderColor:colors[i],
      pointRadius:0
    }));
  }

  const dragConfig = {
    round:1,
    onDragEnd:(e,d,i,v)=>{
      data[i]=v.y;
      updateAll();
    }
  };

  const meanChart = new Chart(document.getElementById('meanChart'),{
    data:{datasets:[]},
    options:{
      plugins:{ dragData: dragConfig },
      scales:{
        x:{title:{display:true,text:'Dato'}},
        y:{title:{display:true,text:'Valor'}}
      }
    }
  });

  const stdChart = new Chart(document.getElementById('stdChart'),{
    data:{datasets:[]},
    options:{
      plugins:{ dragData: dragConfig },
      scales:{
        x:{title:{display:true,text:'Dato'}},
        y:{title:{display:true,text:'Valor'}}
      }
    }
  });

  function updateAll(){
    const m = mean(data);
    const s = stdDev(data);

    document.getElementById('meanValue').textContent = m.toFixed(2);
    document.getElementById('stdValue').textContent = s.toFixed(2);

    document.getElementById('meanEquation').innerHTML =
      `x̄ = (${data.map((x,i)=>`<span style="color:${colors[i]}">${x}</span>`).join(' + ')}) / ${data.length}`;

    document.getElementById('stdEquation').innerHTML =
      `σ = √( ${data.map((x,i)=>`(<span style="color:${colors[i]}">${(x-m).toFixed(2)}</span>)²`).join(' + ')} / ${data.length} )`;

    const dist = document.getElementById('meanDistances');
    dist.innerHTML='';
    data.forEach((x,i)=>{
      const d = Math.abs(x-m).toFixed(2);
      const el = document.createElement('div');
      el.style.color = colors[i];
      el.innerHTML = `|x<sub>${i+1}</sub> − x̄| = ${d}`;
      dist.appendChild(el);
    });

    meanChart.data.datasets = [
      points(data),
      meanLine(data),
      ...deviationLines(data)
    ];

    stdChart.data.datasets = [
      points(data),
      meanLine(data)
    ];

    meanChart.update();
    stdChart.update();
  }

  updateAll();