import './directives/sol-vibrate';
import 'angular';
// duplication of code from Playlist.js with minor change
function mouseCoords(event, targetElement) {
    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = targetElement || event.target;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        currentElement = currentElement.offsetParent;
    }
    while (currentElement);

    if (event.touches) {
        canvasX = event.touches[0].pageX - totalOffsetX;
        canvasY = event.touches[0].pageY - totalOffsetY;
    }
    else {
        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
    }

    return {
        x: canvasX,
        y: canvasY
    };
}


export default angular.module('ui.topbar', ['services', 'solVibrate'])
    .directive('appTopbar', ['playList', 'youtubeAPI', function(playList, youtubeAPI) {
        var definitions = {
            restrict: 'E',
            templateUrl: '/html/topbar/bar.html',
            replace: true,
            scope: {

            },
            controller: function($scope, $element, $attrs, $transclude) {
                $scope.$watch(playList.getNowPlaying, function(newVal, oldVal) {
                    var data = newVal ? newVal.snippet : null,
                        thumbnail = data && data.thumbnails && data.thumbnails.default.url;

                    if (data) {
                        $scope.title = data.title || '';
                        $scope.thumbnail = thumbnail || '';
                    }
                });
            }
        };

        return definitions;
    }])
    .directive('mediaControls', ['playList', 'youtubeAPI', function(playList, youtubeAPI) {
        var definitions = {
            restrict: 'E',
            templateUrl: '/html/topbar/controls.html',
            replace: true,
            controller: function($scope, $element, $attrs, $transclude) {
                $scope.playPrev = function() {
                    playList.prev();
                };

                $scope.playNext = function() {
                    playList.next();
                };

                $scope.playToggle = function() {
                    playList.togglePlay();
                };


                $scope.$watch(
                    () => 
                        playList.getNowPlaying() &&
                            playList.getState() === playList.st.PLAYING,
                    val => $scope.isActive = val);

                $scope.$on('playList:stateChanged', function(e, state) {
                    $scope.isBuffering = playList.getNowPlaying() && [
                        playList.st.PLAYING,
                        playList.st.PAUSING,
                        playList.st.STOPPED
                    ].indexOf(state) < 0;

                    if (!$scope.$$phase) $scope.$digest();
                });
            }
        };

        return definitions;
    }])
    .directive('volume', ['$rootScope', 'youtubePlayer', 'playListVolume', function($rootScope, youtubePlayer, playListVolume) {
        var definitions = {
            restrict: 'E',
            templateUrl: '/html/topbar/volume.html',
            replace: true,
            scope: {

            },
            controller: function($scope, $element, $attrs, $transclude) {
                var _slider = $element[0].querySelector('.slider'),
                    $slider = angular.element(_slider),
                    active = false,
                    getCoordsPercent = function(e, ctx) {
                        var coords = mouseCoords(e, ctx),
                            width = ctx.clientWidth,
                            percent = Math.floor((coords.x / width) * 100);
                        return percent >= 100 ? 100 :
                            percent <= 0 ? 0 :
                            percent;

                    },
                    setWidth = function(e) {
                        var p = getCoordsPercent(e, _slider);

                        playListVolume.set(p);
                    },
                    setRelativeVolume = function(delta) {
                        playListVolume.setRelative(delta);
                    };


                $rootScope.$on('youtubePlayer:infoDelivery', function(e, data) {
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$watch(playListVolume.get, function(value) {
                    $scope.value = value;
                });

                $scope.$watch(playListVolume.isMuted, function(value) {
                    $scope.isMuted = value;
                });

                // Toggle mute
                $scope.toggleMute = function() {
                    playListVolume.toggleMute();
                };

                $slider.on('mousewheel', function(e) {
                    var deltaY = e.wheelDeltaY;
                    if (deltaY > 0) {
                        setRelativeVolume(5);
                    } else {
                        setRelativeVolume(-5);
                    }
                });

                $slider.on('mousedown', function(e) {
                    setWidth(e);
                    active = true;

                    angular.element(document).one('mouseup', function(e) {
                        active = false;
                    });
                });

                $slider.on('touchstart', function(e) {
                    setWidth(e);
                    active = true;

                    angular.element(document).one('touchend', function(e) {
                        active = false;
                    });
                });

                angular.element(document).on('mousemove', function(e) {
                    if (active) {
                        setWidth(e);
                    }
                });

                angular.element(document).on('touchmove', function(e) {
                    if (active) {
                        setWidth(e);
                    }
                });
            }
        };

        return definitions;
    }]);
