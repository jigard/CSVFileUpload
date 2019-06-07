$(document).ready(function () {

    //data_tables rendering
    var table = $('#csvTable').DataTable({

        //call api which contains all data
        "processing": true,
        "ajax": "/csv-view/getJsonData",
        "columnDefs": [
            { "data": "email_id", targets: 0 },
            { "data": "created_at", targets: 1, "visible": false },
            {
                "data": "_id",
                "defaultContent": "",
                targets: 2,
                "orderable": false,
                "searchable": false,
                render: function (data, type, row) {
                    if (type === 'display') {
                        return '<a href="/csv-view/view-health-data/' + data + '" class="edit-table update-btn-clr "><i class="fa fa-eye fa-2x"></i></a>';
                    }
                },
                className: 'dt-body-center'
            }
        ],
        select: {
            style: 'os',
            selector: 'td:not(:last-child)'
        },
        "order": [[1, 'desc']],//for ordering of data

        // initComplete: function () {
        //     this.api().columns().every(function () {
        //         var column = this;
        //         var select = $('<select><option value=""></option></select>')
        //             .appendTo($(column.footer()).empty())
        //             .on('change', function () {
        //                 var val = $.fn.dataTable.util.escapeRegex(
        //                     $(this).val()
        //                 );
        //                 console.log(val);
        //                 column
        //                     .search(val ? '^' + val + '$' : '', true, false)
        //                     .draw();
        //             });

        //         column.data().unique().sort().each(function (d, j) {
        //             select.append('<option value="' + d + '">' + d + '</option>')
        //         });
        //     });
        // },

        // "render": function (d, t, r) {
        //     var $select = $("<select></select>", {
        //         "id": r[0] + "start",
        //         "value": d
        //     });
        //     $.each(times, function (k, v) {
        //         var $option = $("<option></option>", {
        //             "text": v,
        //             "value": v
        //         });
        //         if (d === v) {
        //             $option.attr("selected", "selected")
        //         }
        //         $select.append($option);
        //     });
        //     return $select.prop("outerHTML");
        // }
    });






    //bulk upload
    $('#csvUploadForm').on('submit', function (event) {
        event.preventDefault();

        let file = $('#file').val();
        let quarterId = $('#quarterId').val();

        if (quarterId == '') {
            $('#quarterId').notify("Please Select quarter", "error");
        } else if (!file) {
            //error for select any file
            $('#file').notify('Please Select File First', "error");
        } else {
            $('#loading-image').hide();
            $.ajax({
                type: "POST",
                url: "/csv-view/csvupload",
                contentType: false,
                cache: false,
                data: new FormData(this),
                // data: file,
                processData: false,
                beforeSend: function () {
                    $("#loading-image").show();
                },
                success: function () {
                    //reload data table
                    table.ajax.reload();
                    $('#reset').click();
                    $("#loading-image").hide();

                    //success message after upload file
                    $.notify("Data Uploaded Successfully", "success");

                },
                error: function () {
                    //error message
                    $.notify('Sorry something went wrong', "error");
                }
            })
        }
    })

    $('#csvTable').change(function () {
        var select = $(this).val();
        var data = $('#csvTable').find('tr');

        data.show();

        data.filter(function (index, item) {
            return $(item).find('td:first-child').text().split(',').indexOf(select) === -1;
        }).hide();

        if (select == '') {
            data.show();
        }

    });
});


