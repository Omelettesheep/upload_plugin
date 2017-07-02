;
(function($, window, document, undefined) {
	var myPluginName = 'upload',
		defaults = {
			quality: 0.8,
			maxSize: 10 * 1024 * 1024,
			minSize: 30 * 1024,
			callback: function(data, blob, formdata) {
				console.log("base64 = " + data);
				console.log("blob = ", blob);
				console.log("formdata = ", formdata);

			}
		}
	var cotrPlugin = function(element, options) {
		this.element = element;
		this._defaults = defaults;
		console.log(options)
		this.settings = $.extend({}, this._defaults, options);
		console.log(this.settings)
		this.init();
	}

	cotrPlugin.prototype = {
		init: function() {
			
			this.uploadContainer = $("<div id = 'uploadContainer'></div>")
			this.imageContainer = $("<div id = 'imageContainer'></div>")
			this.imageBox = $("<img id='imgShow'/>")
			var u = navigator.userAgent;
			if (u.toLowerCase().match(/MicroMessenger/i) == 'micromessenger') {
				$('#imgShow').attr('accept', 'image/*');
			}
			this.imageContainer.append(this.imageBox);
			this.file_input = $("<input type = 'file' name='file' accept='image/gif,image/jpeg,image/jpg,image/png,image/svg' id='upload_btn'/>")
			this.buttonBeauty = $('<button>点击上传</button>')
			this.uploadContainer.append(this.imageContainer).append(this.file_input).append(this.buttonBeauty);
			this.element.append(this.uploadContainer)
			$('#upload_btn').on('change', this.getFile.bind(this));
			this.cssSet();
		},

		cssSet: function() {
			this.uploadContainer.css('width', '200px').css('margin', 'auto').css('position', 'relative');
			this.imageContainer.css('height', '200px').css('border', '1px solid #ddd').css('margin-bottom', '5px').css('padding', '5px').css('text-align', 'center');
			this.imageBox.css('maxWidth', '200px').css('maxHeight', '200px');
			this.file_input.css('position', 'absolute').css('left', '0').css('top', '216px').css('opacity', '0').css('width', '100%');
			this.buttonBeauty.css('width', '100%')

		},

		getFile: function(callback) {
			console.log(this);
			this.file = $('#upload_btn').get(0).files[0];
			this.uploadFile(this.file);
		},

		uploadFile: function(file) {
			if (!file) {
				return false;
			}
			// var URL = window.URL || window.webkitURL;
			// 通过 file 生成目标 url
			//	var imgURL = URL.createObjectURL(file);
			var file_realSize;
			if (navigator.userAgent.match(/iphone/i)) {
				file_realSize = file.size - 10 * 1024
			} else {
				file_realSize = file.size;
			}
			if (file_realSize > this.settings.maxSize) {
				alert('图片过大');
				return false;
			} else if (file_realSize < this.settings.minSize) {
				alert('图片过小')
				return false;
			}
			var orientation;
			this.getOrientation(file, function(dir) {
				orientation = dir;
			})
			var reader = new FileReader();
			reader.readAsDataURL(file);
			var _this = this;
			reader.onload = function(e) {
				_this.getImgData(this.result, orientation, _this, function(data) {
					$('#imgShow').attr('src', data);
					var blob = _this.dataURLtoBlob(data);
					var formdata = new FormData();
					formdata.append('file', blob, file['name'])
					_this.settings.callback(data, blob, formdata);

				})
			}
		},

		dataURLtoBlob: function(dataurl) {
			var arr = dataurl.split(','),
				mime = arr[0].match(/:(.*?);/)[1],
				bstr = atob(arr[1]),
				n = bstr.length,
				u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
			return new Blob([u8arr], {
				type: mime
			});
		},

		getOrientation: function(file, callback) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var view = new DataView(e.target.result);
				if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
				var length = view.byteLength,
					offset = 2;
				while (offset < length) {
					var marker = view.getUint16(offset, false);
					offset += 2;
					if (marker == 0xFFE1) {
						if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
						var little = view.getUint16(offset += 6, false) == 0x4949;
						offset += view.getUint32(offset + 4, little);
						var tags = view.getUint16(offset, little);
						offset += 2;
						for (var i = 0; i < tags; i++)
							if (view.getUint16(offset + (i * 12), little) == 0x0112)
								return callback(view.getUint16(offset + (i * 12) + 8, little));
					} else if ((marker & 0xFF00) != 0xFF00) break;
					else offset += view.getUint16(offset, false);
				}
				return callback(-1);
			};
			reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
		},

		getImgData: function(img, dir, that, next) {

			var image = new Image();

			image.onload = function() {

				var degree = 0,
					drawWidth, drawHeight, width, height;

				drawWidth = this.naturalWidth;
				drawHeight = this.naturalHeight;

				// 改变一下图片大小
				var maxSide = Math.max(drawWidth, drawHeight);

				if (maxSide > 600) {
					var minSide = Math.min(drawWidth, drawHeight);
					minSide = minSide / maxSide * 600;
					maxSide = 600;
					if (drawWidth > drawHeight) {
						drawWidth = maxSide;
						drawHeight = minSide;
					} else {
						drawWidth = minSide;
						drawHeight = maxSide;
					}
				}

				// 创建画布
				var canvas = document.createElement("canvas");
				canvas.width = width = drawWidth;
				canvas.height = height = drawHeight;
				var context = canvas.getContext("2d");

				// 判断图片方向，重置 canvas 大小，确定旋转角度，iphone 默认的是 home 键在右方的横屏拍摄方式
				console.log("dir" + dir);
				switch (dir) {
					// iphone 横屏拍摄，此时 home 键在左侧
					case 3:
						// alert(3);
						degree = 180;
						drawWidth = -width;
						drawHeight = -height;
						break;
						// iphone 竖屏拍摄，此时 home 键在下方(正常拿手机的方向)
					case 6:
						// alert(6);
						canvas.width = height;
						canvas.height = width;
						degree = 90;
						drawWidth = width;
						drawHeight = -height;
						break;
						// iphone 竖屏拍摄，此时 home 键在上方
					case 8:
						// alert(8);
						canvas.width = height;
						canvas.height = width;
						degree = 270;
						drawWidth = -width;
						drawHeight = height;
						break;
					default:
						break;
				}

				// 使用 canvas 旋转校正
				context.rotate(degree * Math.PI / 180);
				context.drawImage(this, 0, 0, drawWidth, drawHeight);

				// 返回校正图片
				next(canvas.toDataURL("image/jpeg", that.settings.quality));
			}

			image.src = img;

		}


	}

	$.fn[myPluginName] = function(options) {
		var obj = new cotrPlugin(this, options);

	}

})(jQuery, window, document)

