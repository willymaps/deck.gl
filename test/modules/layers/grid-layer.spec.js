// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
import test from 'tape-catch';
import {makeSpy} from 'probe.gl/test-utils';

import * as FIXTURES from 'deck.gl/test/data';

import {testLayer, testInitializeLayer} from '@deck.gl/test-utils';

import {CPUGridLayer, GridCellLayer} from 'deck.gl';

const getColorValue = points => points.length;
const getElevationValue = points => points.length;
const getPosition = d => d.COORDINATES;

test('CPUGridLayer#renderSubLayer', t => {
  makeSpy(CPUGridLayer.prototype, '_onGetSublayerColor');
  makeSpy(CPUGridLayer.prototype, '_onGetSublayerElevation');

  const layer = new CPUGridLayer({
    data: FIXTURES.points,
    cellSize: 500,
    getPosition,
    pickable: true
  });

  testInitializeLayer({layer});

  // render sublayer
  const subLayer = layer.renderLayers();
  testInitializeLayer({layer: subLayer});

  t.ok(subLayer instanceof GridCellLayer, 'GridCellLayer rendered');

  // should call attribute updater twice
  // because test util calls both initialize and update layer
  t.ok(CPUGridLayer.prototype._onGetSublayerColor.called, 'should call _onGetSublayerColor');
  t.ok(
    CPUGridLayer.prototype._onGetSublayerElevation.called,
    'should call _onGetSublayerElevation'
  );
  CPUGridLayer.prototype._onGetSublayerColor.restore();
  CPUGridLayer.prototype._onGetSublayerElevation.restore();

  t.end();
});

test('CPUGridLayer#updates', t => {
  testLayer({
    Layer: CPUGridLayer,
    testCases: [
      {
        props: {
          data: FIXTURES.points,
          cellSize: 400,
          getPosition,
          pickable: true
        },
        assert({layer}) {
          const {
            layerData,
            sortedColorBins,
            sortedElevationBins,
            colorValueDomain,
            elevationValueDomain
          } = layer.state;

          t.ok(layerData.length > 0, 'CPUGridLayer.state.layerDate calculated');
          t.ok(sortedColorBins, 'CPUGridLayer.state.sortedColorBins calculated');
          t.ok(sortedElevationBins, 'CPUGridLayer.state.sortedColorBins calculated');
          t.ok(Array.isArray(colorValueDomain), 'CPUGridLayer.state.valueDomain calculated');
          t.ok(Array.isArray(elevationValueDomain), 'CPUGridLayer.state.valueDomain calculated');

          t.ok(
            Array.isArray(sortedColorBins.sortedBins),
            'CPUGridLayer.state.sortedColorBins.sortedBins calculated'
          );
          t.ok(
            Array.isArray(sortedElevationBins.sortedBins),
            'CPUGridLayer.state.sortedColorBins.sortedBins calculated'
          );
          t.ok(
            Number.isFinite(sortedColorBins.maxCount),
            'CPUGridLayer.state.sortedColorBins.maxCount calculated'
          );
          t.ok(
            Number.isFinite(sortedElevationBins.maxCount),
            'CPUGridLayer.state.sortedColorBins.maxCount calculated'
          );

          const firstSortedBin = sortedColorBins.sortedBins[0];
          const binTocell = layerData.find(d => d.index === firstSortedBin.i);

          t.ok(
            sortedColorBins.binMap[binTocell.index] === firstSortedBin,
            'Correct CPUGridLayer.state.sortedColorBins.binMap created'
          );
        }
      },
      {
        updateProps: {
          data: FIXTURES.points,
          cellSize: 500,
          getPosition,
          pickable: true
        },
        spies: ['_onGetSublayerColor', '_onGetSublayerElevation'],
        assert({layer, subLayer, spies}) {
          t.ok(subLayer instanceof GridCellLayer, 'GridCellLayer rendered');

          // should call attribute updater twice
          // because test util calls both initialize and update layer
          t.ok(spies._onGetSublayerColor.called, 'should call _onGetSublayerColor');
          t.ok(spies._onGetSublayerElevation.called, 'should call _onGetSublayerElevation');
          spies._onGetSublayerColor.restore();
          spies._onGetSublayerElevation.restore();
        }
      },
      {
        updateProps: {
          cellSize: 800
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData !== layer.state.layerData, 'should update layer data');

          t.ok(
            oldState.sortedColorBins !== layer.state.sortedColorBins,
            'should update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain !== layer.state.colorValueDomain,
            'should update valueDomain'
          );

          t.ok(
            oldState.colorScaleFunc !== layer.state.colorScaleFunc,
            'should update colorScaleFunc'
          );

          t.ok(
            oldState.sortedElevationBins !== layer.state.sortedElevationBins,
            'should update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain !== layer.state.elevationValueDomain,
            'should update elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc !== layer.state.elevationScaleFunc,
            'should update elevationScaleFunc'
          );
        }
      },
      {
        updateProps: {
          getPosition: d => d.COORDINATES,
          updateTriggers: {
            getPosition: 1
          }
        },
        assert({layer, oldState}) {
          t.ok(
            oldState.layerData !== layer.state.layerData,
            'getPosition prop change should update layer data'
          );

          t.ok(
            oldState.sortedColorBins !== layer.state.sortedColorBins,
            'getPosition prop change should update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain !== layer.state.colorValueDomain,
            'getPosition prop change should update valueDomain'
          );

          t.ok(
            oldState.colorScaleFunc !== layer.state.colorScaleFunc,
            'getPosition prop change should update colorScaleFunc'
          );

          t.ok(
            oldState.sortedElevationBins !== layer.state.sortedElevationBins,
            'getPosition prop change should update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain !== layer.state.elevationValueDomain,
            'getPosition prop change should update elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc !== layer.state.elevationScaleFunc,
            'getPosition prop change should update elevationScaleFunc'
          );
        }
      },
      {
        updateProps: {
          getColorValue,
          updateTriggers: {
            getColorValue: 1
          }
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedColorBins !== layer.state.sortedColorBins,
            'should update sortedColorBins'
          );

          t.ok(
            oldState.sortedElevationBins === layer.state.sortedElevationBins,
            'should not update sortedElevationBins'
          );

          t.ok(
            oldState.colorValueDomain !== layer.state.colorValueDomain,
            'should re calculate colorValueDomain'
          );

          t.ok(
            oldState.elevationValueDomain === layer.state.elevationValueDomain,
            'should not update elevationValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc !== layer.state.colorScaleFunc,
            'should update colorScaleFunc'
          );

          t.ok(
            oldState.elevationScaleFunc === layer.state.elevationScaleFunc,
            'should not update colorScaleFunc'
          );
        }
      },
      {
        updateProps: {
          upperPercentile: 90
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedColorBins === layer.state.sortedColorBins,
            'should not update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain !== layer.state.colorValueDomain,
            'should re calculate colorValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc !== layer.state.colorScaleFunc,
            'should update colorScaleFunc'
          );

          t.ok(
            oldState.sortedElevationBins === layer.state.sortedElevationBins,
            'should not update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain === layer.state.elevationValueDomain,
            'should not update elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc === layer.state.elevationScaleFunc,
            'should not update elevationScaleFunc'
          );
        }
      },
      {
        updateProps: {
          colorDomain: [0, 10]
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedColorBins === layer.state.sortedColorBins,
            'should not update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain === layer.state.colorValueDomain,
            'should not re calculate colorValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc !== layer.state.colorScaleFunc,
            'should update colorScaleFunc'
          );

          t.ok(
            oldState.sortedElevationBins === layer.state.sortedElevationBins,
            'should not update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain === layer.state.elevationValueDomain,
            'should not update elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc === layer.state.elevationScaleFunc,
            'should not update elevationScaleFunc'
          );
        }
      },
      {
        updateProps: {
          getElevationValue,
          updateTriggers: {
            getElevationValue: 1
          }
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedElevationBins !== layer.state.sortedElevationBins,
            'should update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain !== layer.state.elevationValueDomain,
            'should re calculate elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc !== layer.state.elevationScaleFunc,
            'should update elevationScaleFunc'
          );

          t.ok(
            oldState.sortedColorBins === layer.state.sortedColorBins,
            'should not update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain === layer.state.colorValueDomain,
            'should not re calculate colorValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc === layer.state.colorScaleFunc,
            'should not update colorScaleFunc'
          );
        }
      },
      {
        updateProps: {
          elevationLowerPercentile: 1
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedElevationBins === layer.state.sortedElevationBins,
            'should not update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain !== layer.state.elevationValueDomain,
            'should re calculate elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc !== layer.state.elevationScaleFunc,
            'should update elevationScaleFunc'
          );

          t.ok(
            oldState.sortedColorBins === layer.state.sortedColorBins,
            'should not update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain === layer.state.colorValueDomain,
            'should not re calculate colorValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc === layer.state.colorScaleFunc,
            'should not update colorScaleFunc'
          );
        }
      },
      {
        updateProps: {
          elevationRange: [1, 10]
        },
        assert({layer, oldState}) {
          t.ok(oldState.layerData === layer.state.layerData, 'should not update layer data');

          t.ok(
            oldState.sortedElevationBins === layer.state.sortedElevationBins,
            'should not update sortedElevationBins'
          );

          t.ok(
            oldState.elevationValueDomain === layer.state.elevationValueDomain,
            'should not re calculate elevationValueDomain'
          );

          t.ok(
            oldState.elevationScaleFunc !== layer.state.elevationScaleFunc,
            'should update elevationScaleFunc'
          );

          t.ok(
            oldState.sortedColorBins === layer.state.sortedColorBins,
            'should not update sortedColorBins'
          );

          t.ok(
            oldState.colorValueDomain === layer.state.colorValueDomain,
            'should not re calculate colorValueDomain'
          );

          t.ok(
            oldState.colorScaleFunc === layer.state.colorScaleFunc,
            'should not update colorScaleFunc'
          );
        }
      }
    ]
  });

  t.end();
});

test('CPUGridLayer#updateTriggers', t => {
  // setup spies
  const SPIES = ['_onGetSublayerColor', '_onGetSublayerElevation'];

  testLayer({
    Layer: CPUGridLayer,
    spies: SPIES,
    testCases: [
      {
        props: {
          data: FIXTURES.points,
          cellSize: 400,
          getPosition
        }
      },
      {
        updateProps: {
          cellSize: 800
        },
        assert({subLayer, spies}) {
          t.ok(spies._onGetSublayerColor.called, 'update radius should call _onGetSublayerColor');
          t.ok(
            spies._onGetSublayerElevation.called,
            'update radius should call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          opacity: 0.1
        },
        assert({subLayer, spies}) {
          t.ok(
            !spies._onGetSublayerColor.called,
            'update opacity should not call _onGetSublayerColor'
          );
          t.ok(
            !spies._onGetSublayerElevation.called,
            'update opacity  should not call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          getColorValue,
          updateTriggers: {
            getColorValue: 1
          }
        },
        assert({subLayer, spies}) {
          t.ok(
            spies._onGetSublayerColor.called,
            'update getColorValue should call _onGetSublayerColor'
          );
          t.ok(
            !spies._onGetSublayerElevation.called,
            'update getColorValue  should not call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          upperPercentile: 90
        },
        assert({subLayer, spies}) {
          t.ok(
            spies._onGetSublayerColor.called,
            'update upperPercentile should call _onGetSublayerColor'
          );
          t.ok(
            !spies._onGetSublayerElevation.called,
            'update upperPercentile should not call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          getElevationValue,
          updateTriggers: {
            getElevationValue: 1
          }
        },
        assert({subLayer, spies}) {
          t.ok(
            !spies._onGetSublayerColor.called,
            'update getElevationValue should not call _onGetSublayerColor'
          );
          t.ok(
            spies._onGetSublayerElevation.called,
            'update getElevationValue should call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          elevationUpperPercentile: 99
        },
        assert({subLayer, spies}) {
          t.ok(
            !spies._onGetSublayerColor.called,
            'update elevationUpperPercentile should not call _onGetSublayerColor'
          );
          t.ok(
            spies._onGetSublayerElevation.called,
            'update elevationUpperPercentile should call _onGetSublayerElevation'
          );
        }
      },
      {
        updateProps: {
          elevationRange: [0, 100]
        },
        assert({subLayer, spies}) {
          t.ok(
            !spies._onGetSublayerColor.called,
            'update elevationRange should not call _onGetSublayerColor'
          );
          t.ok(
            spies._onGetSublayerElevation.called,
            'update elevationRange should call _onGetSublayerElevation'
          );
        }
      }
    ]
  });

  t.end();
});