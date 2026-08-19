// ========== 摄影足迹 — 地图 & 照片联动 ==========

(function() {
    var chartDom = document.getElementById('china-map');
    if (!chartDom) return;

    var myChart = echarts.init(chartDom);

    // ---- 照片分组 ----
    var groups = {};   // { city: [photo, ...] }
    var citySet = {};  // { city: [lng, lat] }

    PHOTOS.forEach(function(p) {
        if (!p.city) return;
        if (!groups[p.city]) groups[p.city] = [];
        groups[p.city].push(p);
        if (CITY_COORDS[p.city] && !citySet[p.city]) {
            citySet[p.city] = CITY_COORDS[p.city];
        }
    });

    // ---- 渲染照片墙 ----
    var gallery = document.getElementById('gallery');
    var cityNames = Object.keys(groups).sort();

    cityNames.forEach(function(city) {
        var photos = groups[city];
        var groupDiv = document.createElement('div');
        groupDiv.className = 'pm-city-group';
        groupDiv.id = 'city-' + city;

        var title = document.createElement('h3');
        title.className = 'pm-city-title';
        title.innerHTML = city + '<span class="count">' + photos.length + ' 张</span>';
        groupDiv.appendChild(title);

        var grid = document.createElement('div');
        grid.className = 'pm-photo-grid';

        photos.forEach(function(p) {
            var card = document.createElement('div');
            card.className = 'pm-photo-card';
            card.setAttribute('data-city', city);
            card.setAttribute('data-file', p.file);
            card.innerHTML =
                '<img src="images/photos/' + p.file + '" alt="' + city + '" loading="lazy">' +
                '<span class="pm-photo-label">' + p.label + '</span>';
            card.addEventListener('click', function() {
                openLightbox('images/photos/' + p.file, city + ' · ' + p.label);
            });
            grid.appendChild(card);
        });

        groupDiv.appendChild(grid);
        gallery.appendChild(groupDiv);
    });

    // ---- 灯箱 ----
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxInfo = document.getElementById('lightbox-info');
    var lightboxClose = document.getElementById('lightbox-close');

    function openLightbox(src, info) {
        lightboxImg.src = src;
        lightboxInfo.textContent = info;
        lightbox.classList.add('active');
    }

    lightboxClose.addEventListener('click', function() {
        lightbox.classList.remove('active');
    });
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });

    // ---- 中国地图 ----
    // 从本地加载 GeoJSON
    fetch('data/china.json')
        .then(function(res) { return res.json(); })
        .then(function(geoJson) {
            echarts.registerMap('china', geoJson);

            // 构建散点数据
            var scatterData = [];
            for (var city in citySet) {
                scatterData.push({
                    name: city,
                    value: [citySet[city][0], citySet[city][1], groups[city].length]
                });
            }

            // 效果散点：显示脉冲波纹的点
            var effectData = scatterData.map(function(d) {
                return { name: d.name, value: [d.value[0], d.value[1]] };
            });

            var option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    formatter: function(p) {
                        if (p.seriesType === 'scatter' || p.seriesType === 'effectScatter') {
                            return '<b>' + p.name + '</b><br/>照片: ' + (p.value[2] || groups[p.name].length) + ' 张';
                        }
                        return p.name;
                    }
                },
                geo: {
                    map: 'china',
                    roam: true,
                    zoom: 1.1,
                    center: [103, 33],
                    itemStyle: {
                        areaColor: '#0d0d0d',
                        borderColor: 'rgba(247,249,250,0.16)',
                        borderWidth: 1
                    },
                    emphasis: {
                        itemStyle: { areaColor: '#161616' },
                        label: { show: false }
                    }
                },
                series: [
                    {
                        // 涟漪脉冲
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: effectData,
                        symbolSize: 12,
                        showEffectOn: 'render',
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 3,
                            period: 4
                        },
                        itemStyle: {
                            color: '#af50ff'
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}',
                            color: '#e1bdff',
                            fontSize: 11
                        },
                        emphasis: {
                            scale: 2
                        }
                    },
                    {
                        // 实心点
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: scatterData,
                        symbolSize: function(val) {
                            return Math.max(6, Math.min(val[2] * 1.5, 22));
                        },
                        itemStyle: {
                            color: '#af50ff',
                            shadowBlur: 10,
                            shadowColor: 'rgba(175,80,255,0.5)'
                        },
                        label: {
                            show: false
                        },
                        emphasis: {
                            scale: 2.5
                        }
                    }
                ]
            };

            myChart.setOption(option);

            // 点击地图标注 → 滚动到对应城市照片
            myChart.on('click', function(params) {
                if (params.seriesType === 'scatter' || params.seriesType === 'effectScatter') {
                    var city = params.name;
                    var el = document.getElementById('city-' + city);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // 高亮闪烁
                        el.style.transition = 'none';
                        el.style.background = 'rgba(175,80,255,0.10)';
                        setTimeout(function() {
                            el.style.transition = 'background 0.8s';
                            el.style.background = '';
                        }, 150);
                    }
                }
            });
        })
        .catch(function(err) {
            console.error('地图加载失败:', err);
            chartDom.innerHTML = '<p style="text-align:center;padding:80px;color:#888;">地图加载失败，请检查网络连接</p>';
        });

    // 窗口缩放
    window.addEventListener('resize', function() {
        myChart.resize();
    });

})();
