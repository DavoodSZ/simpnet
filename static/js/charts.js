(function () {
  var ENVIRONMENTS = [
    { key: "simple_seen", label: "Simple Seen" },
    { key: "simple_unseen", label: "Simple Unseen" },
    { key: "complex_seen", label: "Complex Seen" },
    { key: "complex_unseen", label: "Complex Unseen" }
  ];

  var MAIN = {
    title: "Planning Metrics",
    note: "Interactive benchmark results from Table I. Toggle metrics to compare planning time, path cost, and success rate.",
    tabs: [
      { key: "time", label: "Planning Time ↓", unit: "s" },
      { key: "cost", label: "Planning Cost ↓", unit: "" },
      { key: "success", label: "Success Rate ↑", unit: "%" }
    ],
    groups: ENVIRONMENTS,
    methods: [
      { key: "birrt", label: "Bi-RRT", cls: "bar-birrt" },
      { key: "irrt", label: "IRRT*", cls: "bar-irrt" },
      { key: "mpnet", label: "MPNet", cls: "bar-mpnet" },
      { key: "kg", label: "KG-Planner", cls: "bar-kg" },
      { key: "simp", label: "SIMPNet", cls: "bar-simp" }
    ],
    data: {
      simple_seen: {
        birrt: { time: 1.1, cost: 10.0, success: 97 },
        irrt: { time: 1.2, cost: 5.2, success: 77 },
        mpnet: { time: 0.95, cost: 5.9, success: 94 },
        kg: { time: 0.80, cost: 5.8, success: 93 },
        simp: { time: 0.82, cost: 5.79, success: 95 }
      },
      simple_unseen: {
        birrt: { time: 1.22, cost: 10.1, success: 97 },
        irrt: { time: 1.3, cost: 5.3, success: 84 },
        mpnet: { time: 0.94, cost: 5.7, success: 92 },
        kg: { time: 0.91, cost: 5.8, success: 97 },
        simp: { time: 0.67, cost: 5.9, success: 97 }
      },
      complex_seen: {
        birrt: { time: 3.2, cost: 8.6, success: 75 },
        irrt: { time: 7.5, cost: 4.7, success: 45 },
        mpnet: { time: 7.1, cost: 4.8, success: 47 },
        kg: { time: 4.0, cost: 5.7, success: 60 },
        simp: { time: 7.4, cost: 6.3, success: 72 }
      },
      complex_unseen: {
        birrt: { time: 4.9, cost: 9.9, success: 68 },
        irrt: { time: 6.4, cost: 4.0, success: 34 },
        mpnet: { time: 20.1, cost: 4.4, success: 37 },
        kg: { time: 6.8, cost: 5.7, success: 38 },
        simp: { time: 6.3, cost: 5.9, success: 65 }
      }
    }
  };

  var RFK = {
    title: "Forward-Kinematics Ablation",
    note: "Table II compares SIMPNet with RelaxedFK-SIMPNet. RelaxedFK can reduce time, but often sacrifices success in complex scenes.",
    tabs: [
      { key: "time", label: "Planning Time ↓", unit: "s" },
      { key: "success", label: "Success Rate ↑", unit: "%" }
    ],
    groups: ENVIRONMENTS,
    methods: [
      { key: "simp", label: "SIMPNet", cls: "bar-simp" },
      { key: "rfk", label: "RelaxedFK-SIMPNet", cls: "bar-rfk" }
    ],
    data: {
      simple_seen: { simp: { time: 0.82, success: 95 }, rfk: { time: 0.68, success: 96 } },
      simple_unseen: { simp: { time: 0.67, success: 97 }, rfk: { time: 0.70, success: 98 } },
      complex_seen: { simp: { time: 7.4, success: 72 }, rfk: { time: 2.6, success: 63 } },
      complex_unseen: { simp: { time: 6.3, success: 65 }, rfk: { time: 6.9, success: 54 } }
    }
  };

  var OBSTACLES = {
    title: "Obstacle Count Ablation",
    note: "Table III evaluates SIMPNet in workspaces with different obstacle counts.",
    tabs: [
      { key: "time", label: "Planning Time ↓", unit: "s" },
      { key: "cost", label: "Planning Cost ↓", unit: "" },
      { key: "success", label: "Success Rate ↑", unit: "%" }
    ],
    groups: [
      { key: "obs4", label: "4 Obs." },
      { key: "obs5", label: "5 Obs." },
      { key: "obs6", label: "6 Obs." },
      { key: "obs7", label: "7 Obs." }
    ],
    methods: [
      { key: "simp", label: "SIMPNet", cls: "bar-obstacle" }
    ],
    data: {
      obs4: { simp: { time: 0.76, cost: 4.9, success: 90 } },
      obs5: { simp: { time: 2.8, cost: 6.1, success: 70 } },
      obs6: { simp: { time: 3.5, cost: 6.2, success: 62 } },
      obs7: { simp: { time: 8.1, cost: 7.6, success: 55 } }
    }
  };

  function fmt(value, unit) {
    if (unit === "%") return Math.round(value) + "%";
    var out = value >= 10 ? value.toFixed(1) : value.toFixed(2);
    out = out.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return unit ? out + unit : out;
  }

  function maxValue(spec, metric) {
    if (metric.unit === "%") return 100;
    var max = 0;
    spec.groups.forEach(function (g) {
      spec.methods.forEach(function (m) {
        var v = spec.data[g.key][m.key] && spec.data[g.key][m.key][metric.key];
        if (typeof v === "number") max = Math.max(max, v);
      });
    });
    return max * 1.18;
  }

  function draw(container, spec, tabIndex) {
    var metric = spec.tabs[tabIndex || 0];
    var width = 900;
    var height = spec.methods.length > 2 ? 430 : 360;
    var margin = { top: 22, right: 20, bottom: 72, left: 48 };
    var plotW = width - margin.left - margin.right;
    var plotH = height - margin.top - margin.bottom;
    var ymax = maxValue(spec, metric);
    var groupW = plotW / spec.groups.length;
    var gap = Math.min(10, groupW * 0.08);
    var barW = Math.max(12, (groupW - 2 * gap) / spec.methods.length - 5);
    var svg = [];

    svg.push('<svg class="chart-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img">');
    for (var i = 0; i <= 4; i++) {
      var y = margin.top + plotH - (plotH * i / 4);
      svg.push('<line class="chart-grid-line" x1="' + margin.left + '" y1="' + y + '" x2="' + (width - margin.right) + '" y2="' + y + '"></line>');
      svg.push('<text class="chart-label" x="' + (margin.left - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(ymax * i / 4, metric.unit) + '</text>');
    }

    svg.push('<line class="chart-axis" x1="' + margin.left + '" y1="' + (margin.top + plotH) + '" x2="' + (width - margin.right) + '" y2="' + (margin.top + plotH) + '"></line>');
    svg.push('<line class="chart-axis" x1="' + margin.left + '" y1="' + margin.top + '" x2="' + margin.left + '" y2="' + (margin.top + plotH) + '"></line>');

    spec.groups.forEach(function (g, gi) {
      var gx = margin.left + gi * groupW;
      var startX = gx + (groupW - (spec.methods.length * barW + (spec.methods.length - 1) * 5)) / 2;
      spec.methods.forEach(function (m, mi) {
        var cell = spec.data[g.key][m.key];
        if (!cell) return;
        var v = cell[metric.key];
        var h = Math.max(1, plotH * v / ymax);
        var x = startX + mi * (barW + 5);
        var y = margin.top + plotH - h;
        svg.push('<rect class="' + m.cls + '" x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="4">');
        svg.push('<title>' + g.label + " - " + m.label + ": " + fmt(v, metric.unit) + '</title></rect>');
        if (barW > 16) {
          svg.push('<text class="chart-value" x="' + (x + barW / 2) + '" y="' + (y - 5) + '" text-anchor="middle">' + fmt(v, metric.unit) + '</text>');
        }
      });
      svg.push('<text class="chart-label" x="' + (gx + groupW / 2) + '" y="' + (height - 38) + '" text-anchor="middle">' + g.label + '</text>');
    });

    var lx = margin.left;
    var ly = height - 16;
    spec.methods.forEach(function (m) {
      svg.push('<rect class="' + m.cls + '" x="' + lx + '" y="' + (ly - 10) + '" width="10" height="10" rx="2"></rect>');
      svg.push('<text class="chart-label" x="' + (lx + 15) + '" y="' + ly + '">' + m.label + '</text>');
      lx += Math.max(94, m.label.length * 8 + 28);
    });
    svg.push('</svg>');

    container.querySelector(".chart-plot").innerHTML = svg.join("");
  }

  function mount(id, spec) {
    var container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = [
      '<h3>' + spec.title + '</h3>',
      '<p class="chart-note">' + spec.note + '</p>',
      '<div class="chart-tabs"></div>',
      '<div class="chart-plot"></div>'
    ].join("");

    var tabs = container.querySelector(".chart-tabs");
    spec.tabs.forEach(function (tab, idx) {
      var btn = document.createElement("button");
      btn.className = "chart-tab" + (idx === 0 ? " active" : "");
      btn.type = "button";
      btn.textContent = tab.label;
      btn.addEventListener("click", function () {
        tabs.querySelectorAll(".chart-tab").forEach(function (el) { el.classList.remove("active"); });
        btn.classList.add("active");
        draw(container, spec, idx);
      });
      tabs.appendChild(btn);
    });
    draw(container, spec, 0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    mount("main-chart", MAIN);
    mount("rfk-chart", RFK);
    mount("obstacle-chart", OBSTACLES);
  });
})();
