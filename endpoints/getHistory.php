<?php
include('jsonHeaders.php');

$count = !isset($_POST['count']) ? 5 : $_POST['count'];

$dateString = date('YmdHis');
$hFolder = './cache/history/';

$hFiles = scandir($hFolder, SCANDIR_SORT_DESCENDING);


foreach ($hFiles as $index=>$fName) {
    if ($fName!=='.' && $fName!=='..') {
        if ($index<$count) {
            $fData = gzuncompress(file_get_contents($hFolder . $fName));
            $dateTime = str_replace('.log','', $fName);
            $op['history_files'][] = [ 'dateTime'=>$dateTime, 'data'=>$fData];
            $fData = '';
        }
    };
};


$op['COMPLETE'] = true;
echo json_encode($op);
?>