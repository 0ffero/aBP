<?php
include('jsonHeaders.php');

if (!isset($_POST['history'])) { // history wasnt passed
    $op = ['ERROR'=>'History wasnt passed!'];
    echo json_encode($op);
    exit;
};

$cacheDir = './cache/history/';
if (!is_dir($cacheDir)) { mkdir($cacheDir); };

$history = $_POST['history'];

if (!strlen($history)) { // history is empty!
    $op = ['ERROR'=>'History was empty!'];
    echo json_encode($op);
    exit;
};

$history = gzcompress($history,9); // COMPRESS the HISTORY FILE


// CHECK IF THIS IS A DUPE OF THE LATEST HISTORY FILE
$latest_ctime = 0;
$latest_filename = '';

$files = scandir($cacheDir);
foreach($files as $file) {
    if (is_file($cacheDir . $file) && filectime($cacheDir . $file) > $latest_ctime) {
        $latest_ctime = filectime($cacheDir . $file);
        $latest_filename = $file;
    };
};
if ($latest_filename!='') {
    $oldHistory = file_get_contents($cacheDir . $latest_filename);
    if ($oldHistory==$history) { // IT IS A DUPE, NO NEED TO SAVE
        $op = ['COMPLETE'=>'History dupe. No need to save history data.'];
        echo json_encode($op);
        exit;
    };
};




// THIS ISNT DUPE DATA, SAVE IT
$dateString = date('Ymd_H');
file_put_contents($cacheDir . $dateString . '.log',$history);

$op = ['COMPLETE'=>'Successfully saved the history data!'];
echo json_encode($op);
?>