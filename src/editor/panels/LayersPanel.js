/* eslint-disable no-alert */
import SvgCanvas from "../../svgcanvas/svgcanvas.js";

const { $id } = SvgCanvas;

/**
 *
 */
class LayersPanel {
  /**
   * @param {PlainObject} editor
   */
  constructor(editor) {
    this.updateContextPanel = editor.topPanel.updateContextPanel;
    this.editor = editor;
  }

  /**
   * @param {PlainObject} e event
   * @returns {void}
   */
  lmenuFunc(e) {
    const action = e?.detail?.trigger;
    switch (action) {
    case "dupe":
      this.cloneLayer();
      break;
    case "delete":
      this.deleteLayer();
      break;
    case "merge_down":
      this.mergeLayer();
      break;
    case "merge_all":
      this.editor.svgCanvas.mergeAllLayers();
      this.updateContextPanel();
      this.populateLayers();
      break;
    }
  }
  /**
   * @returns {void}
   */
  init() {
    const template = document.createElement("template");
    const { i18next } = this.editor;

    // eslint-disable-next-line no-unsanitized/property
    template.innerHTML = `
    <div id="sidepanels">
      <div id="sidepanel_handle" title="${i18next.t('ui.panel_action')}">${i18next.t('ui.panel')}</div>
      <div id="sidepanel_content">
        <div id="layerpanel">
          <h3 id="layersLabel">${i18next.t('layers.layers')}</h3>
          <fieldset id="layerbuttons">
            <se-button id="layer_new" title="layers.new" size="small" src="new.svg"></se-button>
            <se-button id="layer_delete" title="layers.del" size="small" src="delete.svg"></se-button>
            <se-button id="layer_rename" title="layers.rename" size="small" src="text.svg"></se-button>
            <se-button id="layer_up" title="layers.move_up" size="small" src="go_up.svg"></se-button>
            <se-button id="layer_down" title="layers.move_down" size="small" src="go_down.svg"></se-button>
            <se-button id="layer_moreopts" title="common.more_opts" size="small" src="context_menu.svg">
            </se-button>
          </fieldset>
          <table id="layerlist">
            <tr class="layer">
              <td class="layervis"></td>
              <td class="layername">Layer 1</td>
            </tr>
          </table>
          <span id="selLayerLabel">${i18next.t('layers.move_elems_to')}</span>
          <select id="selLayerNames" title="${i18next.t('layers.move_selected')}" disabled="disabled">
            <option selected="selected" value="layer1">Layer 1</option>
          </select>
        </div>
     </div>
  </div>
    `;
    this.editor.$svgEditor.append(template.content.cloneNode(true));
    // layer menu added to DOM
    const menuMore = document.createElement("se-cmenu-layers");
    menuMore.setAttribute("id", "se-cmenu-layers-more");
    menuMore.value = "layer_moreopts";
    menuMore.setAttribute("leftclick", true);
    this.editor.$container.append(menuMore);
    menuMore.init(i18next);
    const menuLayerBox = document.createElement("se-cmenu-layers");
    menuLayerBox.setAttribute("id", "se-cmenu-layers-list");
    menuLayerBox.value = "layerlist";
    menuLayerBox.setAttribute("leftclick", false);
    this.editor.$container.append(menuLayerBox);
    menuLayerBox.init(i18next);
    $id("layer_new").addEventListener("click", this.newLayer.bind(this));
    $id("layer_delete").addEventListener("click", this.deleteLayer.bind(this));
    $id("layer_up").addEventListener("click", () => this.moveLayer.bind(this)(-1));
    $id("layer_down").addEventListener("click", () => this.moveLayer.bind(this)(1));
    $id("layer_rename").addEventListener("click", this.layerRename.bind(this));
    $id("se-cmenu-layers-more").addEventListener("change", this.lmenuFunc.bind(this));
    $id("se-cmenu-layers-list").addEventListener("change", (e) => { this.lmenuFunc(e); });
    $id("sidepanel_handle").addEventListener("click", () => this.toggleSidePanel());
    $id("layer_new").init(this.editor);
    $id("layer_delete").init(this.editor);
    $id("layer_up").init(this.editor);
    $id("layer_down").init(this.editor);
    $id("layer_rename").init(this.editor);
    $id("layer_moreopts").init(this.editor);
    this.toggleSidePanel(this.editor.configObj.curConfig.showlayers);
  }
  toggleSidePanel(displayFlag) {
    if (displayFlag === undefined) {
      this.editor.$svgEditor.classList.toggle('open');
    } else if (displayFlag) {
      this.editor.$svgEditor.classList.add('open');
    } else {
      this.editor.$svgEditor.classList.remove('open');
    }
  }
  /**
   * @returns {void}
   */
  newLayer() {
    let uniqName;
    let i = this.editor.svgCanvas.getCurrentDrawing().getNumLayers();
    do {
      uniqName = this.editor.i18next.t("layers.layer") + " " + ++i;
    } while (this.editor.svgCanvas.getCurrentDrawing().hasLayer(uniqName));

    const newName = prompt(
      this.editor.i18next.t('notification.enterUniqueLayerName'),
      uniqName
    );
    if (!newName) {
      return;
    }
    if (this.editor.svgCanvas.getCurrentDrawing().hasLayer(newName)) {
      alert(this.editor.i18next.t('notification.dupeLayerName'));
      return;
    }
    this.editor.svgCanvas.createLayer(newName);
    this.updateContextPanel();
    this.populateLayers();
  }

  /**
   *
   * @returns {void}
   */
  deleteLayer() {
    if (this.editor.svgCanvas.deleteCurrentLayer()) {
      this.updateContextPanel();
      this.populateLayers();
      // This matches what this.editor.svgCanvas does
      // TODO: make this behavior less brittle (svg-editor should get which
      // layer is selected from the canvas and then select that one in the UI)
      const elements = document.querySelectorAll('#layerlist tr.layer');
      Array.prototype.forEach.call(elements, function(el){
        el.classList.remove('layersel');
      });
      document.querySelector('#layerlist tr.layer').classList.add('layersel');

    }
  }

  /**
   *
   * @returns {void}
   */
  cloneLayer() {
    const name =
      this.editor.svgCanvas.getCurrentDrawing().getCurrentLayerName() + " copy";

    const newName = prompt(
      this.editor.i18next.t('notification.enterUniqueLayerName'),
      name
    );
    if (!newName) {
      return;
    }
    if (this.editor.svgCanvas.getCurrentDrawing().hasLayer(newName)) {
      alert(this.editor.i18next.t('notification.dupeLayerName'));
      return;
    }
    this.editor.svgCanvas.cloneLayer(newName);
    this.updateContextPanel();
    this.populateLayers();
  }

  index(el) {
    if (!el) return -1;
    let i = 0;
    do {
      i++;
    } while (el == el.previousElementSibling);
    return i;
  }

  /**
   *
   * @returns {void}
   */
  mergeLayer() {
    if (
      (this.index(document.querySelector("#layerlist tr.layersel"))-1) ===
      this.editor.svgCanvas.getCurrentDrawing().getNumLayers() - 1
    ) {
      return;
    }
    this.editor.svgCanvas.mergeLayer();
    this.updateContextPanel();
    this.populateLayers();
  }

  /**
   * @param {Integer} pos
   * @returns {void}
   */
  moveLayer(pos) {
    const total = this.editor.svgCanvas.getCurrentDrawing().getNumLayers();

    let curIndex = (this.index(document.querySelector("#layerlist tr.layersel"))-1);
    if (curIndex > 0 || curIndex < total - 1) {
      curIndex += pos;
      this.editor.svgCanvas.setCurrentLayerPosition(total - curIndex - 1);
      this.populateLayers();
    }
  }

  /**
   * @returns {void}
   */
  layerRename() {
    const ele = document.querySelector("#layerlist tr.layersel td.layername");
    const oldName = (ele) ? ele.textContent : '';
    const newName = prompt(this.editor.i18next.t('notification.enterNewLayerName'), "");
    if (!newName) {
      return;
    }
    if (
      oldName === newName ||
      this.editor.svgCanvas.getCurrentDrawing().hasLayer(newName)
    ) {
      alert(this.editor.i18next.t('notification.layerHasThatName'));
      return;
    }
    this.editor.svgCanvas.renameCurrentLayer(newName);
    this.populateLayers();
  }

  /**
   * This function highlights the layer passed in (by fading out the other layers).
   * If no layer is passed in, this function restores the other layers.
   * @param {string} [layerNameToHighlight]
   * @returns {void}
   */
  toggleHighlightLayer(layerNameToHighlight) {
    let i;
    const curNames = [];
    const numLayers = this.editor.svgCanvas.getCurrentDrawing().getNumLayers();
    for (i = 0; i < numLayers; i++) {
      curNames[i] = this.editor.svgCanvas.getCurrentDrawing().getLayerName(i);
    }

    if (layerNameToHighlight) {
      curNames.forEach((curName) => {
        if (curName !== layerNameToHighlight) {
          this.editor.svgCanvas
            .getCurrentDrawing()
            .setLayerOpacity(curName, 0.5);
        }
      });
    } else {
      curNames.forEach((curName) => {
        this.editor.svgCanvas.getCurrentDrawing().setLayerOpacity(curName, 1.0);
      });
    }
  }

  /**
   * @returns {void}
   */
  populateLayers() {
    this.editor.svgCanvas.clearSelection();
    const self = this;
    const layerlist = $id("layerlist").querySelector('tbody');
    while(layerlist.firstChild)
      layerlist.removeChild(layerlist.firstChild);

    const selLayerNames = $id("selLayerNames");
    // empty() ref: http://youmightnotneedjquery.com/#empty
    while(selLayerNames.firstChild)
      selLayerNames.removeChild(selLayerNames.firstChild);
    const drawing = this.editor.svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();
    let layer = this.editor.svgCanvas.getCurrentDrawing().getNumLayers();
    // we get the layers in the reverse z-order (the layer rendered on top is listed first)
    while (layer--) {
      const name = drawing.getLayerName(layer);
      const layerTr = document.createElement("tr");
      layerTr.className = (name === currentLayerName) ? 'layer layersel' : 'layer';
      const layerVis = document.createElement("td");
      layerVis.className = (!drawing.getLayerVisibility(name)) ? "layerinvis layervis" : 'layervis';
      const layerName = document.createElement("td");
      layerName.className = 'layername';
      layerName.textContent = name;
      layerTr.appendChild(layerVis);
      layerTr.appendChild(layerName);
      layerlist.appendChild(layerTr);
      // eslint-disable-next-line no-unsanitized/property
      selLayerNames.innerHTML += '<option value="' + name + '">' + name + '</option>';
    }
    // handle selection of layer
    const nelements = $id('layerlist').querySelectorAll("td.layername");
    Array.from(nelements).forEach(function(element) {
      element.addEventListener('mouseup', function(evt) {
        const trElements = $id('layerlist').querySelectorAll("tr.layer");
        Array.from(trElements).forEach(function(element) {
          element.classList.remove("layersel");
        });
        evt.currentTarget.parentNode.classList.add("layersel");
        self.editor.svgCanvas.setCurrentLayer(evt.currentTarget.textContent);
        evt.preventDefault();
      });
      element.addEventListener('mouseup', (evt) => {
        self.toggleHighlightLayer(evt.currentTarget.textContent);
      });
      element.addEventListener('mouseout', (_evt) => {
        self.toggleHighlightLayer();
      });
    });
    const elements = $id('layerlist').querySelectorAll("td.layervis");
    Array.from(elements).forEach(function(element) {
      element.addEventListener('click', function(evt) {
        const ele = evt.currentTarget.parentNode.querySelector("td.layername");
        const name = (ele)? ele.textContent : '';
        const vis = evt.currentTarget.classList.contains("layerinvis");
        self.editor.svgCanvas.setLayerVisibility(name, vis);
        evt.currentTarget.classList.toggle("layerinvis");
      });
    });

    // if there were too few rows, let's add a few to make it not so lonely
    let num = 5 - $id('layerlist').querySelectorAll("tr.layer").length;
    while (num-- > 0) {
      // TODO: there must a better way to do this
      const tlayer = document.createElement("tr");
      tlayer.innerHTML = '<td style="color:white">_</td><td/>';
      layerlist.append(tlayer);
    }
  }
}

export default LayersPanel;
