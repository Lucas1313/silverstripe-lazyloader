<?php
class Page_Controller extends ContentController {

  public function index() {

        // error_log('page.php'. Director::is_ajax());

        // setting a variable if the page request is
        // intended to be an ajax call
        if (Director::is_ajax()) {

            $this -> isAjax = true;

            return $this -> processAjaxRequest();
        }
        else {

            return Array();
            // execution as usual in this case...
        }
    }

  /**
     * processAjaxRequest() function
     * catch all function to dispatch Ajax request to the SS system
     *
     * @author Luc Martin at Clorox
     * @version $ID
     */
    private function processAjaxRequest() {

        if (!isset($_REQUEST)) {
            return json_encode(array(
                'response' => 'The request was empty',
                'error' => '001 Request Empty'
            ));
        }

        foreach ($_REQUEST as $key => $value) {
            $_REQUEST[$key] = Convert::raw2sql($value);
        }

        $type = $_REQUEST['type'];
        switch($type) {
            case 'addUserClick' :
                return $this -> addUserClick();
                break;
            case 'lazyLoad' :
                return $this -> generateLazyLoadPage();
                break;
            case 'filteredPages' :
                return $this -> filteredPages();
                break;
            case 'notifyEditor' :
                return $this -> notifyEditor();
                break;
        }
    }

    /**
     * generateLazyLoadPage function will generate a page following
     * jQuery lazyLoad request
     *
     * @author Luc Martin at Clorox
     * @version $ID
     *
     */
    public function generateLazyLoadPage() {
        if(!empty($_REQUEST['restrAccess'])){
            // Only admin
            $access = false;
            foreach($_REQUEST['lev'] as $v){
               $access = (Permission::check($v) == true || $access == true) ? true : false;
            }
            if ($access == false) {
                return json_encode(array('error' => 'You need to be admin to save that data'));
            }
        }
        //error_log('LAZY LOADER MESSAGE');
        // The object to retrieve
        $dataObject = $_REQUEST['lazyLoadObject'];

        // The sort order for the object to get
        $sortOrder = $_REQUEST['sortOrder'];
        $sortDirection = (isset($_REQUEST['sortDirection'])) ? $_REQUEST['sortDirection'] : 'ASC';
        // default Sort
        if (!isset($sortOrder)) {
            $sortOrder = 'ID';
        }

        // How many elements do we need to load?
        $qtyOfElementsToGet = $_REQUEST['lazyLoadItemCountRequest'];

        // how many objects have been loaded already
        $startLoopAt = $_REQUEST['lazyLoaditemCount'];

        // If the object is a part of the page AND other pages,
        // we need to specify the specific page
        if (isset($_REQUEST['targetPage']) && isset($_REQUEST['pageTitle'])) {

            $targetPage = $_REQUEST['targetPage'];
            $pageTitle = $_REQUEST['pageTitle'];
        }


        // the template to render the object with
        // for instance if your object is FooObject, the template will be
        // themes/yourTheme/templates/Layout/AjaxLazyFooObject.ss
        $renderWithTemplate = (!empty($_REQUEST['renderWithTemplate'])) ? $_REQUEST['renderWithTemplate'] : 'AjaxLazy' . $dataObject;

        // Test if we are looking to a specific page
        if (!empty($targetPage)) {
            // We are TODO so we search for the page and filter with the page title
            $page = $targetPage::get() -> first();

            $allObjects = $page -> $dataObject()-> limit($qtyOfElementsToGet, $startLoopAt) -> sort($sortOrder,$sortDirection);

        }
        else {
            // We are requiring all object of the class
            if(!empty($_REQUEST['filter']) || !empty($_REQUEST['filterBy'])){

                $filter = $_REQUEST['filterBy'] || $_REQUEST['filter'];

                $allObjects = ($filter == 1) ? $dataObject::get()-> limit($qtyOfElementsToGet, $startLoopAt) -> sort($sortOrder,$sortDirection) : $dataObject::get()-> filter($filter)->limit($qtyOfElementsToGet, $startLoopAt) -> sort($sortOrder,$sortDirection);

            }elseif(!empty($_REQUEST['excludeBy'])){

                $allObjects = $dataObject::get()-> exclude($filter)->limit($qtyOfElementsToGet, $startLoopAt) -> sort($sortOrder,$sortDirection);
            }
            else{
                $allObjects = $dataObject::get()-> limit($qtyOfElementsToGet, $startLoopAt) -> sort($sortOrder,$sortDirection) ;
            }

        }

        // Return value init
        $ret = '';

        // Iterator is the quantity of loops we are operating in this call

        $iterator = $startLoopAt;
        $theEnd = true;
        // Iterate through all objects
        foreach ($allObjects as $key => $object) {
            $theEnd = false;
            $object->Exclude_From_Menu = (!empty($object->Exclude_From_Menu)) ? $object->Exclude_From_Menu : 0;

           // error_log('$iterator '.$iterator.' '.$object->ID.' '.$object->Exclude_From_Menu);

            // making sure that we are grabbing the objects starting from the initial load up to the limit
            if ($object -> Exclude_From_Menu != true) {
                // error_log('adding element '.$iterator);
                $object -> Iterator = $iterator;
                //error_log('running through objects');
                $ret .= $object -> renderWith($renderWithTemplate);

            }
            if ($object -> Exclude_From_Menu != 1) {
                //error_log('iterator goes up '.$object->Exclude_From_Menu);
                ++$iterator;
            }

        }
        $ret .= '<script>lazyLoaderGlobalObject.actualItemLoaded = '.$iterator.'; console.log(lazyLoaderGlobalObject);</script>';
        // error_log($ret);
        // No element is necessary
        if ($theEnd == true) {
            return 'end';
        }
        return $ret;
    }
}