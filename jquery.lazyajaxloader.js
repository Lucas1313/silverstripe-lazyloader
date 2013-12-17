/**
 * lazyajaxloader
 * @Version 1.1
 * jQuery plugin by Luc Martin
 *
 */
var lazyLoaderGlobalObject = {
	'itemHeight':0,
	'actualItemLoaded':0,
	'cancelLazyload' : false,
	'extraData' : {}
};
(function($) {

	$.fn.lazyajaxloader = function(args) {
		var actualLoadedPosition = 0,
		lazyLoadOk = true,
		itemCount = 0,
		initialItemsCount = 0,
		listening = true,
		position = 0,
		baseClass = '.'+$(this).attr('class');
		var objectToLoad = $('.'+$(this).children().first().attr('class'));

		// TODO why on earth did I wrote that ???
		if($(this).children().first().attr('class')){
			objectToLoad = $('.'+$(this).children().first().attr('class').split(' ')[0]);
		}

		// Default
		var base = this,
			defaults = {
				url: window.location, // actual page
				targetPage: null, // This is the page class if the object is
				pageTitle: null, // More specifics about the page
				sortOrder:'SortOrder', // The sort order for the requested Object
				sortDirection:'ASC',
				minItems:12, //
				minPxHeight:0,
				promptText:'See more',
				showLoader:true,
				targetContainer : $(this).parent(),
				objectToLoad : objectToLoad,
				triggerButton : null,
				filter : null,
				renderWithTemplate:null,
				loadCallback : null,
				restrA:null,
				lev:''
			};
		//merge in user supplied args
		$.extend(defaults, args || {});

		//Iterate trough all elements set by the plugin
		this.each(function() {
			++ initialItemsCount;
			//console.info('initialItemsCount '+initialItemsCount);
			actualLoadedPosition = $(this).offset().top - $(this).css('height').replace('px','');
			lazyLoaderGlobalObject.itemHeight = $(this).css('height').replace('px','');
			//console.info('actualLoadedPosition '+actualLoadedPosition)
		})

		lazyLoaderGlobalObject.actualItemLoaded =  defaults.minItems || itemCount || initialItemsCount;
		//console.info('itemCount '+itemCount)
		initListeners(defaults);
		initScrollListener(defaults);


		return this.each(function() {
		});

		function initListeners(args){
			if(args.triggerButton){

				lazyLoadOk = false;
				var lazyLoadTrigger = args.triggerButton;
				$(lazyLoadTrigger).on('click', function(){
					lazyLoadOk = true;
					lazyAjax(args);
					return false;
				});
			}
		}

		/**
		 * initScrollListener Function
		 * Initialize the scroll listener
 		 * @param {Object} args
		 */
		function initScrollListener(args){

			var position = $(window).scrollTop();
			////console.info("position="+position)

		   function lazyAjaxCheck(args, position) {

		   		var position = $(window).scrollTop();
				actualLoadedPosition = lazyLoaderGlobalObject.actualItemLoaded * lazyLoaderGlobalObject.itemHeight;

				if ( actualLoadedPosition < position && listening == true) {
					//console.log(actualLoadedPosition + '  >>>>>     ' + $(this).scrollTop())
					////console.info( "Time to Load Content! Ajax request goes here" )
					if(lazyLoadOk == true){
						lazyAjax(args);
					}
				}
			}

			$(window).scroll( function() {

				position = $(this).scrollTop();
				lazyAjaxCheck(args, position)
				////console.info("position="+position)
			} )
		}

		function lazyAjax(args){
			if(lazyLoaderGlobalObject.cancelLazyload == true){
				////console.log('Lazy Loader cancelled');
				lazyLoaderGlobalObject = {cancelLazyload : true};
				return;
			}else{
			////console.info('SENDING AJAX');

			listening = false;
			$('.lazyLoaderFeedback').remove();

			if($(args.triggerButton)){
				$(args.triggerButton).append('<div class="lazyLoaderFeedback" style="display:none;"><strong>LOADING MORE ...</strong></div>');
			}else{
				$(args.targetContainer).append('<div class="lazyLoaderFeedback" style="display:none;"><strong>LOADING MORE ...</strong></div>');
			}
			$('.lazyLoaderFeedback').fadeIn(1000);
			if(args.loadCallback){
				args.loadCallback(args);
			}
			//console.log('Lazy loader loading '+args.minItems+' items')
			var data = {
							'type':'lazyLoad',
							'lazyLoadObject':args.objectToLoad,
							'targetPage':args.targetPage,
							'pageTitle':args.pageTitle,
							'lazyLoaditemCount': lazyLoaderGlobalObject.actualItemLoaded,
							'lazyLoadItemCountRequest':args.minItems,
							'sortOrder':args.sortOrder,
							'sortDirection':args.sortDirection,
							'filter':args.filter,
							'renderWithTemplate' : args.renderWithTemplate,
							'restrA' : args.restrA,
							'lev':args.lev
						};
				for(var n in lazyLoaderGlobalObject.extraData){
					data[n] = lazyLoaderGlobalObject.extraData[n];
				}

				$.ajax({
					url:defaults.url,
					data:data,
					type:'POST',
					success:function(response){
						if(response !== 'end'){
							////console.info('not the end')
							listening = true;
							itemCount = itemCount + args.minItems;
							calculateItemTotalHeight();
							$(args.targetContainer).append(response);
							args.after(args)
						}else{
							if(args.triggerButton){
								$(args.triggerButton).hide();
							}
						}
						$('.lazyLoaderFeedback').remove();
					},
					error : function(error){
						//console.log('LAZY LAODER ERROR!');
						//console.log(error)
					}
				});
			}
		}
		function calculateItemTotalHeight(){
			var n = 0
			var baseClass = $(this).attr('class');
			$('.'+baseClass).each(function(){
				++n;
				if(n == itemCount){
					actualLoadedPosition = $(this).offset().top;
				}
			})
			return actualLoadedPosition;
		}
	};
})(jQuery);
