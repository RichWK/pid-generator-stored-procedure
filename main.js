// Having this logic here in a stored procedure ensures an atomic read-write of the database.

// Documentation for this JS environment can be found here:
// https://azure.github.io/azure-cosmosdb-js-server/


function main( quantity ) {

    if ( quantity > 10 ) {

        quantity = 10;
    }

    // __.filter below returns true or false, depending on whether the operation succeeded.
    // It returns a "feed" of matching items (i.e. documents) as the second parameter passed to the callback function.
    // Using 'filter' is more efficient than using __.queryDocuments combined with a SQL string.
    // See https://devblogs.microsoft.com/cosmosdb/point-reads-versus-queries/ for more details.
    // The first parameter is a predicate and the second is the callback function.

    var isSuccessful = __.filter( criteriaToFilterBy, function( error, feed, options ) {

        if ( error ) handleError( error, "criteriaToFilterBy" );

        // Determine if results were found:

        if ( feed || feed.length ) {

            // Only one item will ever match the filter used above, so it's safe to pick the first item from the feed.

            generatePids( quantity, feed[0] );
        }
        else {
            
            handleError( new Error( "Sorry, no matching items were found when filtering." ), "criteriaToFilterBy" );
        }
    });

    if ( !isSuccessful ) handleError( new Error( "The query was not accepted by the server." ), "criteriaToFilterBy" );
 }



 function criteriaToFilterBy( doc ) {

     return doc.id === "1";
 }



 function generatePids( quantity, item ) {
    
    var pids = [],
        currentPid = item.currentPid;

    for( i = 0; i < quantity; i++ ) {

        pids.push( insert( insert( ++currentPid, 3, "-" ), 7, "-" ) );
    }

    updateDatabase( item, currentPid );
    respond( pids );
 }



function insert( string, index, value ) {

    string = string.toString();
    return string.substr( 0, index ) + value + string.substr( index );
}



function updateDatabase( item, finalPid ) {

    var updatedItem = item;
    updatedItem.currentPid = finalPid;

    __.replaceDocument( item._self, updatedItem, function( error ) {

        if ( error ) handleError( error, "updateDatabase" );
    });
}



 function respond( message ) {

    getContext().getResponse().setBody( JSON.stringify( message ) );
 }



function handleError( error, context ) {

    respond( "An error occurred in this function on the server: " + context );    

    throw error;
}

